import 'server-only'

import { verifyIdToken } from '@/utils/verifyToken'
import { connectToDatabase, MongoDBClient } from './mongoClient';
import { cache } from 'react';

type CategoryData = {
    [generalCategory: string]: {
      totalCount: number;  // total docs in this general category
      subcategories: {
        [subcategory: string]: number;  // count of docs in this subcategory
      }
    }
  }

  

const getMongoDBClientConnection = cache(async () => {
    const db = await connectToDatabase();
    if (!db) {
      console.log("Error: getMongoDBClientConnection() failed");
      return null;
    }
    return db;
  });
  

export const getTier = cache(async () => {
      const tokenPayload = await verifyIdToken();
      const tier = tokenPayload.payload?.["custom:tier"] as string || "free";
      return tier;
});

export const getRolesClient = cache(async (tier: string) => {
    const db = await getMongoDBClientConnection();
    if (!db) {
        console.error("Error: getMongoDBClientConnection() failed");
        return null;
    }
    return tier === "free" ? null : getRoles(db, tier);
});


export const getAverageSalary = cache(async (db: MongoDBClient) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: null,
                    avgMinSalary: { $avg: "$adj_min_amount" },
                    avgMaxSalary: { $avg: "$adj_max_amount" },
                }
            },
            {
                $project: {
                    _id: 0,
                    avgMinSalary: 1,
                    avgMaxSalary: 1,
                    overallAvgSalary: { $avg: ["$avgMinSalary", "$avgMaxSalary"] }
                }
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result;

    } catch (error) {
        console.error('Error: getAverageSalary() failed:', error);
        return [];
    }
});

export const getTotalJobs = cache(async (db: MongoDBClient) => {
    try {
        const result = await db.collection('JobPostings').countDocuments();
        return result;

    } catch (error) {
        console.error('Error: getTotalJobs() failed:', error);
        return -1;
    }
});


// data for search containers
export const getRoles = cache(async (db: MongoDBClient, tier: string): Promise<CategoryData | null> => {
    try {
        const pipeline = [
            {
                $match: {
                    "categories.0": { $exists: true }
                }
            },
            {
                $project: {
                    generalCategory: { $arrayElemAt: ["$categories", 0] },
                    subCategory: { $ifNull: [{ $arrayElemAt: ["$categories", 1] }, "Other"] }
                }
            },
            {
                $group: {
                    _id: {
                        general: "$generalCategory",
                        sub: "$subCategory"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.general",
                    totalCount: { $sum: "$count" },
                    subs: {
                        $push: {
                            name: "$_id.sub",
                            count: "$count"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    totalCount: 1,
                    subcategories: {
                        $arrayToObject: {
                            $map: {
                                input: "$subs",
                                as: "sub",
                                in: {
                                    k: "$$sub.name",
                                    v: "$$sub.count"
                                }
                            }
                        }
                    }
                }
            }
        ];

        const result = await db.collection("JobPostings").aggregate(pipeline).toArray();

        // Convert array result to CategoryData format
        const categoryData: CategoryData = {};
        result.forEach(item => {
            categoryData[item.category] = {
                totalCount: item.totalCount,
                subcategories: item.subcategories
            };
        });
        return categoryData;
    } catch (error) {
        console.error('Error fetching roles:', error);
        return null;
    }
});
    

export const getRoleData = cache(async (category: string, subcategory: string, tier: string) => {
    try {
        const tier = await getTier();
        const db = await getMongoDBClientConnection();

        if (!db?.collection) {
            console.error("Error: getMongoDBClientConnection() failed");
            return null;
        }

        // Get all data in parallel using a single db connection
        const [
            roleSalaryStats,
            marketSalaryAverage,
            marketTotalJobs,
            salaryDistributionForRole,
            roleMarketDemand,
            roleTopSkills,
            roleLocations
           
        ] = await Promise.all([
            getRoleSalaryStats(db, category, subcategory),
            getAverageSalary(db),
            getTotalJobs(db),
            getSalaryDistributionForRole(db, category, subcategory),
            getRoleMarketDemand(db, category, subcategory),
            getRoleTopSkills(db, category, subcategory),
            getRoleLocations(db, category, subcategory)
        ]);

        return {
            "roleSalaryStats": roleSalaryStats,
            "marketSalaryAverage": marketSalaryAverage,
            "marketTotalJobs": marketTotalJobs,
            "salaryDistributionForRole": salaryDistributionForRole,
            "marketDemand": roleMarketDemand,
            "topSkills": roleTopSkills,
            "locations": roleLocations
        };
    } catch (error) {
        console.error('Error: getRoleData() failed:', error);
        return null;
    }  
});

export const getRoleSalaryStats = cache(async (db: MongoDBClient, category: string, subcategory: string) => {
    try {
        const matchStage: any = {
            "categories.0": category,  // Always match the primary category
            adj_min_amount: { $exists: true, $ne: null },
            adj_max_amount: { $exists: true, $ne: null }
        };

        // Only add subcategory filter when it's NOT "All"
        if (subcategory !== "All") {
            matchStage["categories.1"] = subcategory;
        }
        // When subcategory IS "All", we only match categories.0 (primary category)

        const pipeline = [
            {
                $match: matchStage
            },
            {
                $group: {
                    _id: null,
                    avgMinSalary: { $avg: "$adj_min_amount" },
                    avgMaxSalary: { $avg: "$adj_max_amount" },
                    jobCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    avgMinSalary: 1,
                    avgMaxSalary: 1,
                    overallAvgSalary: { $avg: ["$avgMinSalary", "$avgMaxSalary"] },
                    jobCount: 1
                }
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result[0] || null;
    } catch (error) {
        console.error('Error: getRoleSalaryStats() failed:', error);
        return null;
    }
});


const getSalaryDistributionForRole = cache(async (db: MongoDBClient, category: string, subcategory: string) => {
    try {
        // Build the match stage based on category and subcategory
        const matchStage: any = {
            "categories.0": category,  // Always match the primary category
            adj_min_amount: { $exists: true, $ne: null },
            adj_max_amount: { $exists: true, $ne: null }
        };

        // Only add subcategory filter when it's NOT "All"
        if (subcategory !== "All") {
            matchStage["categories.1"] = subcategory;
        }

        const pipeline = [
            {
                $match: matchStage
            },
            {
                $project: {
                    minSalary: "$adj_min_amount",
                    maxSalary: "$adj_max_amount"
                }
            },
            {
                $facet: {
                    minSalaries: [
                        {
                            $bucket: {
                                groupBy: "$minSalary",
                                boundaries: [0, 50000, 70000, 90000, 110000, 130000, 150000, 180000, 200000, 220000, 240000, 260000, 280000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000],
                                default: "1Mil",
                                output: {
                                    count: { $sum: 1 },
                                    examples: { $push: { salary: "$minSalary", interval: "yearly" } }
                                }
                            }
                        }
                    ],
                    maxSalaries: [
                        {
                            $bucket: {
                                groupBy: "$maxSalary",
                                boundaries: [0, 50000, 70000, 90000, 110000, 130000, 150000, 180000, 200000, 220000, 240000, 260000, 280000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000],
                                default: "1Mil",
                                output: {
                                    count: { $sum: 1 },
                                    examples: { $push: { salary: "$maxSalary", interval: "yearly" } }
                                }
                            }
                        }
                    ],
                    totalJobs: [
                        {
                            $count: "total"
                        }
                    ]
                }
            }
        ];
        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result[0] || { minSalaries: [], maxSalaries: [], totalJobs: [{ total: 0 }] };
    } catch (error) {
        console.error('Error: getSalaryDistributionForRole() failed:', error);
        return { minSalaries: [], maxSalaries: [], totalJobs: [{ total: 0 }] };
    }
});


export const getRoleMarketDemand = cache(async (db: MongoDBClient, category: string, subcategory: string) => {
    try {
        // Build the match stage based on category and subcategory
        const roleMatchStage: any = {
            "categories.0": category
        };

        // Only add subcategory filter when it's NOT "All"
        if (subcategory !== "All") {
            roleMatchStage["categories.1"] = subcategory;
        }

        const pipeline = [
            {
                $facet: {
                    roleCount: [
                        { $match: roleMatchStage },
                        { $count: "total" }
                    ],
                    totalJobs: [
                        { $count: "total" }
                    ]
                }
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        const roleCount = result[0]?.roleCount[0]?.total || 0;
        const totalJobs = result[0]?.totalJobs[0]?.total || 0;

        let roleRank = 0;

        if (subcategory === "All") {
            // Compare against all other roles
            const rolesData = await getRoles(db, "premium");
            if (rolesData) {
                const sortedRoles = Object.entries(rolesData)
                    .sort(([,a], [,b]) => b.totalCount - a.totalCount);
                roleRank = sortedRoles.findIndex(([roleName]) => roleName === category) + 1;
            }
        } else {
            // Compare against all other role+subcategory combinations (excluding "All")
            const allCombinationsQuery = [
                {
                    $match: {
                        "categories.0": { $exists: true },
                        "categories.1": { $exists: true, $ne: null }
                    }
                },
                {
                    $project: {
                        generalCategory: { $arrayElemAt: ["$categories", 0] },
                        subCategory: { $arrayElemAt: ["$categories", 1] }
                    }
                },
                {
                    $group: {
                        _id: {
                            general: "$generalCategory",
                            sub: "$subCategory"
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ];

            const allCombinations = await db.collection('JobPostings').aggregate(allCombinationsQuery).toArray();
            
            // Find the rank of our current combination
            roleRank = allCombinations.findIndex(item => 
                item._id.general === category && item._id.sub === subcategory
            ) + 1;
        }
        
        const roleMarketDemand = {
            count: roleCount,
            totalJobs: totalJobs,
            popularityScore: totalJobs > 0 ? (roleCount / totalJobs) * 100 : 0,
            popularityRank: roleRank || 0 // Use 0 if not found in rankings
        };
        return roleMarketDemand;
    } catch (error) {
        console.error('Error: getRoleMarketDemand() failed:', error);
        return null;
    }
});

export const getRoleTopSkills = cache(async (db: MongoDBClient, category: string, subcategory: string) => {
    try {
        // Validate input parameters
        if (!db || !category) {
            console.error('Error: getRoleTopSkills() - invalid parameters');
            return [];
        }

        // Build the match stage based on category and subcategory
        const roleMatchStage: any = {
            "categories.0": category,
            extracted_keywords: {
                $exists: true,
                $ne: []
            }
        };

        // Only add subcategory filter when it's NOT "All"
        if (subcategory !== "All") {
            roleMatchStage["categories.1"] = subcategory;
        }

        const pipeline = [
            // Match jobs that belong to the specified role/subcategory and have skills
            {
                $match: roleMatchStage
            },
            // Unwind the extracted_keywords array to work with individual skills
            {
                $unwind: "$extracted_keywords"
            },
            // Group by skill and count occurrences
            {
                $group: {
                    _id: "$extracted_keywords",
                    count: { $sum: 1 }
                }
            },
            // Sort by count in descending order
            {
                $sort: { count: -1 }
            },
            // Project to match the expected output format
            {
                $project: {
                    _id: 0,
                    keyword: "$_id",
                    count: 1
                }
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        
        // Validate the result is an array
        if (!Array.isArray(result)) {
            console.error('Error: getRoleTopSkills() - result is not an array:', typeof result);
            return [];
        }

        // Validate each item in the result has the expected structure
        const validatedResult = result.filter(item => {
            return item && 
                   typeof item === 'object' && 
                   typeof item.keyword === 'string' && 
                   typeof item.count === 'number' &&
                   !item.$map && // Ensure it's not a MongoDB aggregation object
                   !item.$group && // Additional check for aggregation objects
                   !item.$match; // Additional check for aggregation objects
        });

        return validatedResult;

    } catch (error) {
        console.error('Error: getRoleTopSkills() failed:', error);
        return [];
    }
});


export const getRoleLocations = cache(async (db: MongoDBClient, category: string, subcategory: string) => {
    try {
        // Validate input parameters
        if (!db || !category) {
            console.error('Error: getRoleLocations() - invalid parameters');
            return [];
        }

        // Build the match stage based on category and subcategory
        const roleMatchStage: any = {
            "categories.0": category,
            location_coords: { $exists: true, $ne: [] },
            location: { $exists: true, $nin: [null, ""] }
        };

        // Only add subcategory filter when it's NOT "All"
        if (subcategory !== "All") {
            roleMatchStage["categories.1"] = subcategory;
        }

        const pipeline = [
            // Match jobs that belong to the specified role/subcategory and have location data
            {
                $match: roleMatchStage
            },
            // Group by location and count occurrences
            {
                $group: {
                    _id: "$location",
                    count: { $sum: 1 },
                    location_coords: { $first: "$location_coords" }
                }
            },
            // Sort by count in descending order
            {
                $sort: { count: -1 }
            },
            // Project to match the expected output format
            {
                $project: {
                    _id: 0, 
                    location: "$_id",
                    location_coords: 1,
                    count: 1
                }
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        
        // Validate the result is an array
        if (!Array.isArray(result)) {
            console.error('Error: getRoleLocations() - result is not an array:', typeof result);
            return [];
        }

        // Validate each item in the result has the expected structure
        const validatedResult = result.filter(item => {
            return item && 
                   typeof item === 'object' && 
                   typeof item.location === 'string' && 
                   typeof item.count === 'number' &&
                   Array.isArray(item.location_coords) &&
                   !item.$map && // Ensure it's not a MongoDB aggregation object
                   !item.$group && // Additional check for aggregation objects
                   !item.$match; // Additional check for aggregation objects
        });

        return validatedResult;

    } catch (error) {
        console.error('Error: getRoleLocations() failed:', error);
        return [];
    }
});

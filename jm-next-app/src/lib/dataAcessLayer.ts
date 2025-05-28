import 'server-only'

import { verifyIdToken } from '@/utils/verifyToken'
import { connectToDatabase, MongoDBClient } from './mongoClient';
import { cache } from 'react';
import { buildJobTitleTree, JobTitle } from './buildJobTitleTree';

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

export const getTopSkillsClient = cache(async (tier: string) => {
    const db = await getMongoDBClientConnection();
    if (!db) {
        console.error("Error: getMongoDBClientConnection() failed");
        return [];
    }
    return getTopSkills(db, tier);
});

export const getOverviewData = cache(async () => {
    try {
        const tier = await getTier();
        const db = await getMongoDBClientConnection();



        if (!db?.collection) {
            console.error("Error: getMongoDBClientConnection() failed");
            return null;
        }

        // Get all data in parallel using a single db connection
        const [
            topSkills,
            averageSalary,
            totalJobs,

            remoteVsOnsiteJobs,
            topJobTitles,
            topLocations
        ] = await Promise.all([
            getTopSkills(db, tier),
            getAverageSalary(db),
            getTotalJobs(db),
            getRemoteVsOnsiteJobs(db),
            getTopJobTitles(db, tier),
            getTopLocations(db, tier)
        ]);

        return {
            "topSkills": topSkills,
            "averageSalary": averageSalary,
            "totalJobs": totalJobs,
            "remoteVsOnsiteJobs": remoteVsOnsiteJobs,
            "topJobTitles": topJobTitles,
            "topLocations": topLocations
        };
    } catch (error) {
        console.error('Error: getOverviewData() failed:', error);
        return null;
    }
});

export const getTopSkills = cache(async (db: MongoDBClient, tier: string) => {

    try {

        // dummy values for free tier; they're blurred out in the frontend
        if (tier === "free") {
            const fakeRes = [] as any;
            const fakeVals = [1732, 343, 869, 2345, 234, 602, 767, 345, 100, 1220, 4032, 120, 402, 230] as Array<number>;
            const fakeTechnologies: string[] = [
                "QuantumScript",
                "NebulaJS",
                "HyperWeave",
                "SynthOS",
                "ByteForge",
                "MetaFrame",
                "GrapheneDB",
                "VoidStack",
                "NanoFlow",
                "CyberLisp"
              ];
              
            fakeVals.sort((a,b) => b-a)
            for (let i = 0; i < fakeVals.length; i++) {
                fakeRes.push({ "_id": String(fakeTechnologies[i % fakeTechnologies.length]) + String(i), "totalOccurrences": fakeVals[i] });
            }
            return fakeRes;
        }

        const tiersMapParams = {
            "free": 5,
            "basic": 15,
            "premium": 1000
        };

        const pipeline = [
            {
                $match: {
                    extracted_keywords: { $exists: true, $ne: [] }
                }
            },
            {
                $unwind: "$extracted_keywords"
            },
            {
                $group: {
                    _id: "$extracted_keywords",
                    totalOccurrences: { $sum: 1 }
                }
            },
            {
                $sort: { totalOccurrences: -1 }
            },
            {
                $limit: tiersMapParams[tier as keyof typeof tiersMapParams]
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result;

    } catch (error) {
        console.error('Error: getTopSkills() failed:', error);
        return [];
    }
});

export const getAverageSalary = cache(async (db: MongoDBClient) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: null,
                    avgMinSalary: { $avg: "$min_amount" },
                    avgMaxSalary: { $avg: "$max_amount" },
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

export const getKeywordsConnectedByJob = cache(async (db: MongoDBClient, tier: string) => {
    try {
        const tiersMapParams = {
            "free": 10,
            "basic": 15,
            "premium": 100
        };

        const pipeline = [
            {
                $match: {
                    extracted_keywords: { $exists: true, $ne: [] }
                }
            },
            {
                $unwind: "$extracted_keywords"
            },
            {
                $group: {
                    _id: "$extracted_keywords",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: tiersMapParams[tier as keyof typeof tiersMapParams]
            },
            {
                $group: {
                    _id: null,
                    topKeywords: { $push: "$_id" }
                }
            },
            {
                $lookup: {
                    from: "JobPostings",
                    pipeline: [
                        {
                            $match: {
                                extracted_keywords: { $exists: true, $ne: [] }
                            }
                        },
                        {
                            $project: { extracted_keywords: 1 }
                        }
                    ],
                    as: "jobs"
                }
            },
            {
                $unwind: "$jobs"
            },
            {
                $unwind: "$jobs.extracted_keywords"
            },
            {
                $match: {
                    $expr: {
                        $in: ["$jobs.extracted_keywords", "$topKeywords"]
                    }
                }
            },
            {
                $group: {
                    _id: "$jobs._id",
                    keywords: { $push: "$jobs.extracted_keywords" }
                }
            },
            {
                $project: {
                    pairs: {
                        $reduce: {
                            input: { $range: [0, { $subtract: [{ $size: "$keywords" }, 1] }] },
                            initialValue: [],
                            in: {
                                $concatArrays: [
                                    "$$value",
                                    {
                                        $map: {
                                            input: { $range: [{ $add: ["$$this", 1] }, { $size: "$keywords" }] },
                                            as: "j",
                                            in: {
                                                source: { $arrayElemAt: ["$keywords", "$$this"] },
                                                target: { $arrayElemAt: ["$keywords", "$$j"] }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $unwind: "$pairs"
            },
            {
                $group: {
                    _id: {
                        source: "$pairs.source",
                        target: "$pairs.target"
                    },
                    weight: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    source: "$_id.source",
                    target: "$_id.target",
                    weight: "$weight"
                }
            },
            {
                $sort: { weight: -1 }
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result;

    } catch (error) {
        console.error('Error: getKeywordsConnectedByJob() failed:', error);
        return [];
    }
});

export const getRemoteVsOnsiteJobs = cache(async (db: MongoDBClient) => {
    try {
        const pipeline = [
            {
                $match: {
                    is_remote: { $exists: true }  // Only include documents where is_remote exists
                }
            },
            {
                $group: {
                    _id: "$is_remote",
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$count" },
                    remote: {
                        $sum: {
                            $cond: [{ $eq: ["$_id", true] }, "$count", 0]
                        }
                    },
                    nonRemote: {
                        $sum: {
                            $cond: [{ $eq: ["$_id", false] }, "$count", 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    remote: 1,
                    nonRemote: 1,
                    remotePercentage: { $multiply: [{ $divide: ["$remote", "$total"] }, 100] },
                    nonRemotePercentage: { $multiply: [{ $divide: ["$nonRemote", "$total"] }, 100] }
                }
            }
        ];
        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result;
    } catch (error) {
        console.error('Error: getRemoteVsOnsiteJobs() failed:', error);
        return [];
    }
});












export const getTopJobTitles = cache(async (db: MongoDBClient, tier: string) => {
    // the queries used in scraping
    const terms = [
        "software engineer",
        "back end developer",
        "front end developer",
        "devops",
        "AI/ML",
        "security",
        "mobile",
        "data engineer",
    ]

    const scrapedTitles = [
        'software engineer',
        'junior software engineer',
        'mid level software engineer',
        'senior software engineer',
        'front end developer', 
        'backend developer', 
        'full stack developer',
        'devops engineer',
        'security engineer',
        'cloud engineer',
        'UI/UX engineer',
        'web developer',
        'network engineer',
        'mobile developer',
        'mobile engineer',
        'ios developer',
        'android developer',
        'data scientist',
        'data engineer',
        'AI engineer',
        'AI developer',
        'machine learning engineer',
        'ML engineer',
        'embedded software engineer',
        'cybersecurity analyst',
        'systems engineer',
        'cloud security engineer',
        'database administrator',
        'QA engineer',
        'firmware engineer',
        'systems administrator',
        'IT engineer',
        'MLOps engineer',
        'SOC Analyst',
        'game developer'
    ]

    try {
        const tiersMapParams = {
            "free": 20,
            "basic": 15,
            "premium": 1000
        };

        // just get all the titles
        const pipeline = [
            {
                $match: {
                    title: { $exists: true, $ne: "" }
                }
            },
            {
                $project: {
                    // Keep both original and normalized title
                    originalTitle: "$title",
                    normalizedTitle: { $toLower: "$title" }
                }
            },
            {
                $group: {
                    _id: "$normalizedTitle",
                    count: { $sum: 1 },
                    // Store one example of the original title for display
                    title: { $first: "$originalTitle" }
                }
            },
            {
                $sort: { count: -1 }
            },
            // {
            //     $limit: 10
            // },
            {
                $project: {
                    _id: 0,
                    title: 1,
                    count: 1
                }
            }
        ];

        

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result
 
    } catch (error) {
        console.error('Error: getTopJobTitles() failed:', error);
        return [];
    }
});

export const getTopLocations = cache(async (db: MongoDBClient, tier: string) => {
    try {
        
        // const tiersMapParams = {
        //     "free": 1000,
        //     "basic": 15,
        //     "premium": 50
        // };

        const pipeline = [
            {
                $match: {
                    location_coords: { $exists: true, $ne: [] }
                }
            },
            {
                $group: {
                    _id: "$location",
                    count: { $sum: 1 },
                    location_coords: { $first: "$location_coords" }
                }
            },
            {
                $sort: { count: -1 }
            },
            // {
            //     $limit: 1000
            // },
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
        return result;

    } catch (error) {
        console.error('Error: getTopJobTitles() failed:', error);
        return [];
    }
});









// **********************************************
// **********************************************

// SKILLS PAGE CALLS

// **********************************************
// **********************************************


export const getSkillData = cache(async (skill: string) => {
    try {
        const tier = await getTier();
        const db = await getMongoDBClientConnection();

        if (!db?.collection) {
            console.error("Error: getMongoDBClientConnection() failed");
            return null;
        }

        // Get all data in parallel using a single db connection
        const [
            salaryDistributionForSkill,
            detailedSalaryMetrics,
            topJobs,
            relatedSkills,
            skillSalaryStats,
            marketDemand
        ] = await Promise.all([
            getSalaryDistributionForSkill(db, skill),
            getDetailedSalaryMetrics(db, skill),
            getTopJobForSkill(db, skill),
            getRelatedSkills(db, skill),
            getSkillSalaryStats(db, skill),
            getSkillMarketDemand(db, skill)
        ]);

        return {
            "salaryDistributionForSkill": salaryDistributionForSkill,
            "detailedSalaryMetrics": detailedSalaryMetrics,
            "topJobs": topJobs,
            "relatedSkills": relatedSkills,
            "skillSalaryStats": skillSalaryStats,
            "marketDemand": marketDemand
        };
    } catch (error) {
        console.error('Error: getSkillData() failed:', error);
        return null;
    }  
});

const getSalaryDistributionForSkill = cache(async (db: MongoDBClient, skill: string) => {
    try {
        const pipeline = [
            {
                $match: {
                    extracted_keywords: { $exists: true, $ne: [] },
                    $and: [
                        { min_amount: { $exists: true, $ne: null } },
                        { max_amount: { $exists: true, $ne: null } }
                    ]
                }
            },
            {
                $unwind: "$extracted_keywords"
            },
            {
                $match: {
                    extracted_keywords: skill
                }
            },
            {
                $project: {
                    interval: 1,
                    // Compute the interval - if missing and amount < 150, assume hourly
                    
                    minSalary: {
                        $switch: {
                            branches: [
                                {
                                    case: { $lt: [{ $toDouble: "$min_amount" }, 150] },
                                    then: { $multiply: [{ $toDouble: "$min_amount" }, 40, 52] }
                                },
                                {
                                    case: {
                                        $and: [
                                            { $eq: ["$interval", null] },
                                            { $lt: [{ $toDouble: "$min_amount" }, 150] }
                                        ]
                                    },
                                    then: { $multiply: [{ $toDouble: "$min_amount" }, 40, 52] }
                                },
                                {
                                    case: { $eq: ["$interval", "daily"] },
                                    then: { $multiply: [{ $toDouble: "$min_amount" }, 5, 52] }
                                },
                                {
                                    case: { $eq: ["$interval", "weekly"] },
                                    then: { $multiply: [{ $toDouble: "$min_amount" }, 52] }
                                },
                                {
                                    case: { $eq: ["$interval", "monthly"] },
                                    then: { $multiply: [{ $toDouble: "$min_amount" }, 12] }
                                }
                            ],
                            default: { $toDouble: "$min_amount" }
                        }
                    },
                    maxSalary: {
                        $switch: {
                            branches: [
                                {
                                    case: { $lt: [{ $toDouble: "$max_amount" }, 150] },
                                    then: { $multiply: [{ $toDouble: "$max_amount" }, 40, 52] }
                                },
                                {
                                    case: {
                                        $and: [
                                            { $eq: ["$interval", null] },
                                            { $lt: [{ $toDouble: "$max_amount" }, 150] }
                                        ]
                                    },
                                    then: { $multiply: [{ $toDouble: "$max_amount" }, 40, 52] }
                                },
                                {
                                    case: { $eq: ["$interval", "daily"] },
                                    then: { $multiply: [{ $toDouble: "$max_amount" }, 5, 52] }
                                },
                                {
                                    case: { $eq: ["$interval", "weekly"] },
                                    then: { $multiply: [{ $toDouble: "$max_amount" }, 52] }
                                },
                                {
                                    case: { $eq: ["$interval", "monthly"] },
                                    then: { $multiply: [{ $toDouble: "$max_amount" }, 12] }
                                }
                            ],
                            default: { $toDouble: "$max_amount" }
                        }
                    }
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
                                    examples: { $push: { salary: "$minSalary", interval: "$interval" } }
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
                                    examples: { $push: { salary: "$maxSalary", interval: "$interval" } }
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
        return result[0] || { minSalaries: [], maxSalaries: [], totalJobs: 0 };
    } catch (error) {
        console.error('Error: getSalaryDistributionForSkill() failed:', error);
        return null;
    }
});



const getDetailedSalaryMetrics = cache(async (db: MongoDBClient, skill: string) => {
    try {
        const pipeline = [
            // First, get all salaries for the specific skill
            {
                $match: {
                    extracted_keywords: skill,
                    min_amount: { $exists: true, $ne: null },
                    max_amount: { $exists: true, $ne: null }
                }
            },
            {
                $project: {
                    salary: {
                        $avg: [
                            { $toDouble: "$min_amount" },
                            { $toDouble: "$max_amount" }
                        ]
                    }
                }
            },
            {
                $facet: {
                    // Get overall salary metrics for comparison
                    overallMetrics: [
                        {
                            $group: {
                                _id: null,
                                median: { $avg: "$salary" },  // Using avg instead of percentile for now
                                min: { $min: "$salary" },
                                max: { $max: "$salary" }
                            }
                        }
                    ],
                    // Get skill-specific metrics
                    skillMetrics: [
                        {
                            $group: {
                                _id: null,
                                median: { $avg: "$salary" },  // Using avg instead of percentile for now
                                min: { $min: "$salary" },
                                max: { $max: "$salary" }
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    skillMetrics: { $arrayElemAt: ["$skillMetrics", 0] },
                    overallMetrics: { $arrayElemAt: ["$overallMetrics", 0] }
                }
            },
            {
                $project: {
                    skillMetrics: 1,
                    overallMetrics: 1,
                    salaryPremium: {
                        $subtract: ["$skillMetrics.median", "$overallMetrics.median"]
                    }
                }
            },
            {
                $project: {
                    skillMetrics: 1,
                    overallMetrics: 1,
                    salaryPremium: 1,
                    salaryPremiumPercentage: {
                        $multiply: [
                            {
                                $divide: [
                                    "$salaryPremium",
                                    "$overallMetrics.median"
                                ]
                            },
                            100
                        ]
                    }
                }
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result[0] || null;
    } catch (error) {
        console.error('Error: getDetailedSalaryMetrics() failed:', error);
        return null;
    }
});

export const getTopJobForSkill = cache(async (db: MongoDBClient, skill: string) => {
    try {
        const pipeline = [
            {
                $match: {
                    extracted_keywords: { $in: [skill] },
                    title: { $exists: true, $ne: "" }
                }
            },
            {
                $project: {
                    // Keep both original and normalized title
                    originalTitle: "$title",
                    normalizedTitle: { $toLower: "$title" }
                }
            },
            {
                $group: {
                    _id: "$normalizedTitle",
                    count: { $sum: 1 },
                    // Store one example of the original title for display
                    title: { $first: "$originalTitle" }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $project: {
                    _id: 0,
                    title: 1,
                    count: 1
                }
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result;

    } catch (error) {
        console.error('Error: getTopJobForSkill() failed:', error);
        return [];
    }
});

export const getRelatedSkills = cache(async (db: MongoDBClient, skill: string) => {
    try {
        const pipeline = [
            // Match jobs that contain the given skill in their extracted_keywords
            {
                $match: {
                    extracted_keywords: {
                        $exists: true,
                        $ne: [],
                        $in: [skill]
                    }
                }
            },
            // Unwind the extracted_keywords array to work with individual keywords
            {
                $unwind: "$extracted_keywords"
            },
            // Group by keyword and count occurrences
            {
                $group: {
                    _id: "$extracted_keywords",
                    count: { $sum: 1 }
                }
            },
            // Exclude the input skill from results
            {
                $match: {
                    _id: { $ne: skill }
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
        return result;

    } catch (error) {
        console.error('Error: getRelatedSkills() failed:', error);
        return [];
    }
});

// Helper function to calculate median
const calculateMedian = (numbers: number[]): number => {
    if (!numbers || numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid];
};

export const getSkillMarketDemand = cache(async (db: MongoDBClient, skill: string) => {
    try {
        // Get the skill count and total jobs
        const pipeline = [
            {
                $facet: {
                    skillCount: [
                        { $match: { extracted_keywords: skill } },
                        { $count: "total" }
                    ],
                    totalJobs: [
                        { $count: "total" }
                    ]
                }
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        const skillCount = result[0]?.skillCount[0]?.total || 0;
        const totalJobs = result[0]?.totalJobs[0]?.total || 0;

        // Get the ranking from getTopSkills
        const topSkills = await getTopSkills(db, "premium"); // Use premium to get all skills
        const skillRank = topSkills.findIndex((s: { _id: string }) => s._id === skill) + 1;

        return {
            count: skillCount,
            totalJobs: totalJobs,
            popularityScore: (skillCount / totalJobs) * 100,
            popularityRank: skillRank || 0 // Use 0 if skill not found in rankings
        };
    } catch (error) {
        console.error('Error: getSkillMarketDemand() failed:', error);
        return null;
    }
});

export const getSkillSalaryStats = cache(async (db: MongoDBClient, skill: string) => {
    try {
        const pipeline = [
            {
                $match: {
                    extracted_keywords: skill,
                    min_amount: { $exists: true, $ne: null, $gte: 40000 },
                    max_amount: { $exists: true, $ne: null, $gte: 40000 }
                }
            },
            {
                $project: {
                    avgSalary: {
                        $avg: [
                            { $toDouble: "$min_amount" },
                            { $toDouble: "$max_amount" }
                        ]
                    }
                }
            },
            {
                $facet: {
                    skillStats: [
                        {
                            $group: {
                                _id: null,
                                mean: { $avg: "$avgSalary" },
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    overallStats: [
                        {
                            $lookup: {
                                from: "JobPostings",
                                pipeline: [
                                    {
                                        $match: {
                                            min_amount: { $exists: true, $ne: null, $gte: 40000 },
                                            max_amount: { $exists: true, $ne: null, $gte: 40000 }
                                        }
                                    },
                                    {
                                        $project: {
                                            avgSalary: {
                                                $avg: [
                                                    { $toDouble: "$min_amount" },
                                                    { $toDouble: "$max_amount" }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: null,
                                            mean: { $avg: "$avgSalary" },
                                            count: { $sum: 1 }
                                        }
                                    }
                                ],
                                as: "overall"
                            }
                        }
                    ]
                }
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        const skillData = result[0]?.skillStats[0];
        const overallData = result[0]?.overallStats[0]?.overall[0];

        if (!skillData || !overallData) return null;

        return {
            mean: skillData.mean,
            count: skillData.count,
            overallMean: overallData.mean,
            overallCount: overallData.count,
            salaryPremium: skillData.mean - overallData.mean,
            salaryPremiumPercentage: ((skillData.mean - overallData.mean) / overallData.mean) * 100
        };
        
    } catch (error) {
        console.error('Error: getSkillSalaryStats() failed:', error);
        return null;
    }
});



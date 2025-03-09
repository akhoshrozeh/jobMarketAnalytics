import 'server-only'

import { verifyIdToken } from '@/utils/verifyToken'
import { connectToDatabase } from './mongoClient';
import { cache } from 'react';

// Cache the database connection itself, not just the data access functions
const getDbConnection = cache(async () => {
  console.log("Creating new database connection...");
  return await connectToDatabase();
});

const getTier = cache(async () => {
    const tokenPayload = await verifyIdToken();
    const tier = tokenPayload.payload?.["custom:tier"] as string || "free";
    return tier;
});


export const getTopSkills = cache(async () => {
    console.log("top-skills route handler called..");


    try {
        const tier = await getTier();
        console.log("DAL tier:", tier);
        const tiersMapParams = {
            "free": 5,
            "basic": 15,
            "premium": 100
        }
    
        
        // Use the cached database connection
        const db = await getDbConnection();
    
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
    return []
    }
})

export const getAverageSalary = cache(async () => {
    
    try {
        // Use the cached database connection
        const db = await getDbConnection();

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
        ]

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result;

    } catch (error) {
        console.error('Error: getAverageSalary() failed:', error);
        return []
    }
})


export const getTotalJobs = cache(async () => {
    
    try {
        // Use the cached database connection
        const db = await getDbConnection();

        const result = await db.collection('JobPostings').countDocuments();
        return result;

    } catch (error) {
        console.error('Error: getTotalJobs() failed:', error);
        return -1;
    }
})


export const getKeywordsConnectedByJob = cache(async () => {
    try {
        const db = await getDbConnection();


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
                $limit: 50
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
               
          
        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();        return result;

    } catch (error) {
        console.error('Error: getKeywordsConnectedByJob() failed:', error);
        return []
    }
})


export const getRemoteVsOnsiteJobs = cache(async () => {
    try {
        const db = await getDbConnection();
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
          ]
        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result;
    } catch (error) {
        console.error('Error: getRemoteVsOnsiteJobs() failed:', error);
        return []   
    }
})

// export const getTopJobTitles = cache(async () => {
//     try {
//         const tier = await getTier();
//         console.log("DAL tier for job titles:", tier);
//         const tiersMapParams = {
//             "free": 50,
//             "basic": 15,
//             "premium": 50
//         }
        
//         const db = await getDbConnection();
        
//         // Define the job title categories we want to match
//         const jobTitleCategories = [
//             'software engineer',
//             'junior software engineer',
//             'mid level software engineer',
//             'senior software engineer',
//             'front end', 
//             'backend developer', 
//             'full stack developer',
//             'devops engineer',
//             'security engineer',
//             'cloud engineer',
//             'UI/UX engineer',
//             'web developer',
//             'network engineer',
//             'mobile developer',
//             'mobile engineer',
//             'ios developer',
//             'android developer',
//             'data scientist',
//             'data engineer',
//             'AI engineer',
//             'AI developer',
//             'machine learning engineer',
//             'ML engineer',
//             'embedded software engineer',
//             'cybersecurity analyst',
//             'systems engineer',
//             'cloud security engineer',
//             'database administrator',
//             'QA engineer',
//             'firmware engineer',
//             'systems administrator',
//             'IT engineer',
//             'MLOps engineer',
//             'SOC Analyst',
//             'game developer'
//         ];
        
//         // Create regex patterns for each category (case insensitive)
//         const regexPatterns = jobTitleCategories.map(category => ({
//             category,
//             regex: new RegExp(category, 'i')
//         }));
        
//         // Calculate date from 2 weeks ago and format it as a string
//         const twoWeeksAgo = new Date();
//         twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
//         const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
//         console.log(`Filtering for jobs posted since: ${twoWeeksAgoStr}`);
        
//         // First, get all job titles from the past 2 weeks
//         // Since date_posted is a string, we'll use string comparison
//         const allJobTitles = await db.collection('JobPostings')
//             .find({ 
//                 title: { $exists: true, $ne: "" },
//                 date_posted: { $gte: twoWeeksAgoStr }  // String comparison
//             })
//             .project({ title: 1, _id: 0 })
//             .toArray();
        
//         console.log(`Found ${allJobTitles.length} job postings from the past 2 weeks`);
        
//         // Count occurrences for each category
//         const categoryCounts: Record<string, number> = {};
        
//         allJobTitles.forEach(job => {
//             if (!job.title) return;
            
//             // Find matching category
//             for (const pattern of regexPatterns) {
//                 if (pattern.regex.test(job.title)) {
//                     const category = pattern.category;
//                     categoryCounts[category] = (categoryCounts[category] || 0) + 1;
//                     break; // Stop after first match to avoid double counting
//                 }
//             }
//         });
        
//         // Convert to array and sort
//         const result = Object.entries(categoryCounts)
//             .map(([title, count]) => ({ title, count }))
//             .sort((a, b) => b.count - a.count)
//             .slice(0, tiersMapParams[tier as keyof typeof tiersMapParams]);
        
//         console.log("DAL result for job titles:", result);
//         return result;
        
//     } catch (error) {
//         console.error('Error: getTopJobTitles() failed:', error);
//         return []
//     }
// })
export const getTopJobTitles = cache(async () => {
    try {
        const tier = await getTier();
        console.log("DAL tier for job titles:", tier);
        const tiersMapParams = {
            "free": 20,
            "basic": 15,
            "premium": 50
        }
        
        const db = await getDbConnection();
        
        // Calculate date from 2 weeks ago and format it as a string
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        console.log(`Filtering for jobs posted since: ${twoWeeksAgoStr}`);
        
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
            {
                $limit: tiersMapParams[tier as keyof typeof tiersMapParams]
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
        console.log("DAL result for job titles:", result);
        if (tier === "free") {
            result.forEach(job => {
                job.title = job.title.replace("placeholder", "");
            })
        }
        return result;
        
    } catch (error) {
        console.error('Error: getTopJobTitles() failed:', error);
        return []
    }
})

export const getTopLocations = cache(async () => {
    try {
        const tier = await getTier();
        console.log("DAL tier for job titles:", tier);
        const tiersMapParams = {
            "free": 100,
            "basic": 15,
            "premium": 50
        }
        
        const db = await getDbConnection();

        const pipeline = [
            {
                $match: {
                    location: { $exists: true, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$location",
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
                $project: {
                    _id: 0, 
                    location: "$_id",
                    count: 1
                }
            }
        ];

        const result = await db.collection('JobPostings').aggregate(pipeline).toArray();
        return result;
        
        
        
    } catch (error) {
        console.error('Error: getTopJobTitles() failed:', error);
        return []
    }
})
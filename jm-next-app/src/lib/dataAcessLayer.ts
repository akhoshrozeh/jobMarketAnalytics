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
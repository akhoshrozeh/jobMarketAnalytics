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

const getTier = cache(async () => {
    const tokenPayload = await verifyIdToken();
    const tier = tokenPayload.payload?.["custom:tier"] as string || "free";
    return tier;
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
        const tiersMapParams = {
            "free": 10000,
            "basic": 15,
            "premium": 50
        };

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
            {
                $limit: tiersMapParams[tier as keyof typeof tiersMapParams]
            },
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
        console.log("location RSE:", result)
        return result;

    } catch (error) {
        console.error('Error: getTopJobTitles() failed:', error);
        return [];
    }
});
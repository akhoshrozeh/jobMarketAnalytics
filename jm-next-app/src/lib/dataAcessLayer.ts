import 'server-only'

import { verifyIdToken } from '@/utils/verifyToken'
import { connectToDatabase } from './mongoClient';
import { cache } from 'react';

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
    
        
        // Connect to MongoDB
        const db = await connectToDatabase();
    
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
    const tier = await getTier();
    
    try {
        const db = await connectToDatabase();

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

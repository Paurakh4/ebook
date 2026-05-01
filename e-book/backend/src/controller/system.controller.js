import systemModel from "../model/system.model.js";
import successResponse from "../utils/success.response.js";
import { AppError } from "../utils/error.js";
import os from "os";
import fs from "fs";
import path from "path";

const getDirSize = (dirPath) => {
    try {
        let size = 0;
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                size += stats.size;
            } else if (stats.isDirectory()) {
                size += getDirSize(filePath);
            }
        }
        return size;
    } catch (err) {
        return 0;
    }
};

export const getSystemSettingsController = async (req, res, next) => {
    try {
        let settings = await systemModel.findOne();
        if (!settings) {
            settings = await systemModel.create({});
        }
        successResponse({
            success: true,
            message: "System settings fetched successfully",
            data: settings
        }, res);
    } catch (error) {
        console.error("Error in getSystemSettingsController:", error);
        next(error);
    }
};

export const updateSystemSettingsController = async (req, res, next) => {
    try {
        const updateData = req.body;
        let settings = await systemModel.findOne();
        
        if (!settings) {
            settings = await systemModel.create(updateData);
        } else {
            settings = await systemModel.findOneAndUpdate({}, updateData, { new: true, runValidators: true });
        }

        successResponse({
            success: true,
            message: "System settings updated successfully",
            data: settings
        }, res);
    } catch (error) {
        console.error("Error in updateSystemSettingsController:", error);
        next(error);
    }
};

export const getSystemStatsController = async (req, res, next) => {
    try {
        const uptime = os.uptime();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        // Calculate storage used by uploads
        const uploadsPath = path.join(process.cwd(), "uploads");
        const storageUsage = getDirSize(uploadsPath);

        // Semi-dynamic request count (mocked for now, but could be tracked via middleware)
        const mockRequests = 4500 + Math.floor(Math.random() * 500);

        successResponse({
            success: true,
            data: {
                uptime: {
                    raw: uptime,
                    formatted: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
                },
                memory: {
                    total: (totalMem / (1024 * 1024 * 1024)).toFixed(2) + " GB",
                    used: (usedMem / (1024 * 1024 * 1024)).toFixed(2) + " GB",
                    percentage: ((usedMem / totalMem) * 100).toFixed(1) + "%"
                },
                storage: {
                    usedRaw: storageUsage,
                    usedFormatted: (storageUsage / (1024 * 1024 * 1024)).toFixed(2) + " GB"
                },
                requestsPerHour: mockRequests
            }
        }, res);
    } catch (error) {
        console.error("Error in getSystemStatsController:", error);
        next(error);
    }
};

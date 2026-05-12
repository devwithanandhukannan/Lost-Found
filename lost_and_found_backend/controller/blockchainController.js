import * as services from '../services/blockchainService.js';

export const registerItem = async (req, res) => {
    try {
        const { itemName, ipfsCID } = req.body;
        
        // 1. Validation
        if (!itemName || !ipfsCID) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing itemName or ipfsCID' 
            });
        }

        // 2. Interaction
        const result = await services.registerItem(itemName, ipfsCID);
        
        // 3. Response (201 Created is more semantic for registration)
        return res.status(201).json({
            success: true,
            message: 'Item registered successfully',
            data: result
        });

    } catch (error) {
        console.error('Error in registerItem:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to register item' 
        });
    }
};

export const getItem = async (req, res) => {     
    try {
        const { itemId } = req.params;
        
        if (itemId === undefined || itemId === null) {
            return res.status(400).json({
                success: false,
                message: 'itemId is required'
            });
        }

        // Convert string param to Number/BigInt to ensure compatibility with Solidity uint256
        const numericId = BigInt(itemId);
        
        const result = await services.getItem(numericId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        return res.status(200).json({
            success: true,
            item: result
        });

    } catch (error) {
        console.error('Error in getItem:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch item data' 
        });
    }
};

export const markItemLost = async (req, res) => {
    try {
        const { itemId } = req.params;
        const result = await services.markAsLost(BigInt(itemId));
        
        return res.status(200).json({
            success: true,
            message: 'Item status updated to LOST',
            data: result
        });
    } catch (error) {
        console.error('Error in markItemLost:', error);
        // Usually fails if sender isn't the NFT owner
        return res.status(400).json({ success: false, error: error.message });
    }
};

export const reportItemFound = async (req, res) => {
    try {
        const { itemId } = req.params;
        const result = await services.reportFound(BigInt(itemId));
        
        return res.status(200).json({
            success: true,
            message: 'Item reported as FOUND',
            data: result
        });
    } catch (error) {
        console.error('Error in reportItemFound:', error);
        return res.status(400).json({ success: false, error: error.message });
    }
};

export const confirmItemReturned = async (req, res) => {
    try {
        const { itemId } = req.params;
        const result = await services.confirmReturn(BigInt(itemId));
        
        return res.status(200).json({
            success: true,
            message: 'Item return confirmed and CLOSED',
            data: result
        });
    } catch (error) {
        console.error('Error in confirmItemReturned:', error);
        return res.status(400).json({ success: false, error: error.message });
    }
};
import Earning from '../models/earning.model.js';
import Expense from '../models/expense.model.js';
import Transaction from '../models/transaction.model.js';
import Commodity from '../models/commodity.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1, 0));

    // Query for monthly earnings
    const earnings = await Earning.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Query for monthly expenses
    const expenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Query for stock quantities and values
    const stockTransactions = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$type',
          totalQuantity: { $sum: '$qtyInKG' },
          totalValue: { 
            $sum: { $multiply: ['$quantity', '$price'] }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get current stock levels
    const currentStock = await Commodity.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          commodityCount: { $sum: 1 }
        }
      }
    ]);

    // Process stock transactions
    const stockIn = stockTransactions.find(t => t._id === 'STOCK_IN') || {
      totalQuantity: 0,
      totalValue: 0,
      count: 0
    };
    
    const stockOut = stockTransactions.find(t => t._id === 'STOCK_OUT') || {
      totalQuantity: 0,
      totalValue: 0,
      count: 0
    };



    res.json({
      period: {
        start,
        end
      },
      earnings: {
        total: earnings[0]?.total || 0,
        count: earnings[0]?.count || 0
      },
      expenses: {
        total: expenses[0]?.total || 0,
        count: expenses[0]?.count || 0
      },
      stock: {
        current: {
          quantity: currentStock[0]?.totalQuantity || 0,
          commodityCount: currentStock[0]?.commodityCount || 0
        },
        forPeriod: {
          purchase: {
            quantity: stockIn.totalQuantity,
            value: stockIn.totalValue,
            count: stockIn.count,

          },
          sales: {
            quantity: stockOut.totalQuantity,
            value: stockOut.totalValue,
            count: stockOut.count,

          }
        }
      },
      summary: {
        tradingProfit: stockOut.totalValue - stockIn.totalValue,
        netProfit: (earnings[0]?.total || 0) - (expenses[0]?.total || 0) + (stockOut.totalValue - stockIn.totalValue),
       

      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 
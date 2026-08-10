const { query } = require("../config/db");
const { success, error } = require("../utils/response");

const getStats = async (req, res, next) => {
  try {
    const [products, board, careers, news, otherServices] = await Promise.all([
      query("SELECT COUNT(*) FROM products"),
      query("SELECT COUNT(*) FROM board_members"),
      query("SELECT COUNT(*) FROM careers"),
      query("SELECT COUNT(*) FROM news"),
      query("SELECT COUNT(*) FROM other_services"),
    ]);

    return success(res, {
      products:       parseInt(products.rows[0].count),
      board:          parseInt(board.rows[0].count),
      careers:        parseInt(careers.rows[0].count),
      news:           parseInt(news.rows[0].count),
      other_services: parseInt(otherServices.rows[0].count),
    });
  } catch (err) { next(err); }
};

module.exports = { getStats };

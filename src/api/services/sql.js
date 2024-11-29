const connection = require("../middlewares/db")

module.exports = async function getData(order_id){
    let sql = await connection.getrow(`SELECT

    IFNULL((LENGTH(loan_id) - LENGTH(REPLACE(loan_id,",",""))), 0) AS noOfFacility,

    net_salary as net_salary,

CASE

    WHEN salary_range = 'None' OR salary_range IS NULL OR salary_range = '' THEN IFNULL(net_salary, 0)

WHEN salary_range = 'MYR 1,000 - MYR 2,000' THEN 1500

WHEN salary_range = 'MYR 2,000 - MYR 3,000' THEN 2500

    WHEN salary_range = 'MYR 3,000  -MYR 4,000' THEN 3500

    WHEN salary_range = 'MYR 4,000 - MYR 5,000' THEN 4500

WHEN salary_range = 'MYR 5,000 and Above' THEN 5000

    ELSE 0

END AS salary

FROM spider.finance

WHERE order_id = '${order_id}'`)

return sql;

}
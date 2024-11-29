import { createRequire } from 'module';
const require = createRequire(import.meta.url)

import {config} from "dotenv-safe";
import path from "path";

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({
    path: path.join(__dirname, '../../../../.env'),
    example: path.join(__dirname, '../../../../.env.example'),
});

const connection = require("../../middlewares/db");

const orderID = 'A00001'

const existing = await connection.query(`SELECT id
                                             FROM credit_model.CM_CompAsia
                                             where OrderID = ?`, [orderID]);
console.dir(existing)

const nric = '740401115081'
const [latestCustomerInfo] = await connection.query(`
    SELECT status
    FROM credit_model.cbm_customer
    WHERE NRIC = ?
    ORDER BY CreatedAt DESC
    LIMIT 1
`, [nric])

console.dir(latestCustomerInfo)

process.exit()
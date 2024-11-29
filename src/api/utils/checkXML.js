
const xml2 = require('xml2js')
const fs = require('fs')


module.exports = async function getCData(file) {
    var parser = new xml2.Parser()
    let res = await parser.parseStringPromise(file).then(function(result){
        let item;
        if(result.Response.Errors[0].length === 0){
            item = result.Response.XML[0]
        }else{
            item = {
                status: 'failed',
                error: result.Response.Errors
            }
        }
        return item
    })
    return res
}
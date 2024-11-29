const xml2 = require('xml2js')

module.exports = async function refactorXML(file){
    var parser = new xml2.Parser()
    let res = await parser.parseStringPromise(file).then((result) => {
        return result.Response.Report[0].Profile
    })

    return res
}
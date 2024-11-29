const xml2 = require('xml2js')


module.exports = async function getEntity(file){
    var parser = new xml2.Parser();
    let res = await parser.parseStringPromise(file).then(function(result){
        console.log(result.Response.Subjects[0].Subject[0].EntityCode[0]);
        let item = result.Response.Subjects[0].Subject[0].EntityCode[0]
         return item
    })
	return res
}
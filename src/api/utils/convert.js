const fs = require("fs");
const jimp = require("jimp");
const xml2 = require("xml2js");
const { json2xml } = require("xml-js");

// module.export = function base64ToImage(file){
// const base64 = fs.readFileSync(file, 'base64')
// const buffer = Buffer.from(base64, "base64")
// let result = jimp.read(buffer, (err, res)=> {
//     if(err) throw new Error(err)
//     res.quality(50).write("after.jpg")
// })
// return result
// }

// module.export = function imageToBase64(image){
//     return "data:image/gif;base64,"+fs.readFileSync(image, 'base64');
// }

// module.export = function pdfToBase64(file){
//    let result =  fs.readFile(file, function(err,data){
//         if(err) throw err
//         return data.toString('base64')
//     })

//     return result
// }

module.exports = async function xmlToJson(file) {
  var parser = new xml2.Parser();
  let res = await parser.parseStringPromise(file).then(function (result) {
    let item;
    if (
      result.Response.Errors[0].length === 0 ||
      result.Response.Errors[0].Error[0] === ""
    ) {
      item = result.Response.ReqNo[0];
    } else {
      item = result.Response.Errors;
    }
    return item;
  });
  return res;
};

// module.exports = function jsonToXml1(jsonObj){
//     console.log(jsonObj);
//     try {
//         const json = JSON.stringify(jsonObj)
//         const xml = json2xml(json, {compact: true, spaces: 4})
//         return xml
//     } catch (error) {
//         console.log(error);
//     }

// }

// module.exports = function ObjToArray(obj) {
//     var arr = obj instanceof Array;

//     return (arr ? obj : Object.keys(obj)).map(function(i) {
//       var val = arr ? i : obj[i];
//       if(typeof val === 'object')
//         return ObjToArray(val);
//       else
//         return val;
//     });
//   }

// module.exports = function firstRequest(nric, name, dob){
//     const request = {
//         Request:[{
//             SystemID: 'SCBS',
//             Service: 'INDDTLRPTS',
//             ReportType: 'ICR-S',
//             MemberID: 'CP06653',
//             UserID: 'PCP066530003',
//             SequenceNo:001,
//             ReqDate:'DateTime',
//             PurposeStdCode:'CREREV',
//             Subject:[{
//                 IdNo1: nric,
//                 Name: name,
//                 Dob: dob,
//                 ConstitutionTypeStdCode: 11
//             }]
//         }]
//     }
//     return request;
// }

// module.exports = function secondRequest(){
//     const secondRequest = {
//         Request:[{
//             SystemID: 'SCBS',
//             Service: 'INDDTLRPTS',
//             ReportType: 'ICR-S',
//             MemberID: 'CP06653',
//             UserID: 'PCP066530003',
//             ReqNo:'123',
//             SequenceNo:001,
//             ReqDate:'DateTime',
//             PurposeStdCode:'CREREV',
//             Subject:[{
//                 IdNo1:'nric',
//                 Name: 'nadme',
//                 ConstitutionTypeStdCode: 11
//             }]
//         }]
//     }

//     return secondRequest
// }

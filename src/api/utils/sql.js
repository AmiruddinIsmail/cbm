const INSERTREPORT = `INSERT INTO sys.log (SystemID,Service,ReportType,MemberID,UserID,ReqNo,SequenceNo,IdNo1,ReqDate,Name,Dob,ConstitutionTypeStdCode,PurposeStdCode) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`


module.exports = INSERTREPORT
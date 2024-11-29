const fs = require("fs");
const connection = require("../middlewares/db");
const getHeader = require("../utils/cbm/header");
const getProfile = require("../utils/cbm/profile/profile");
const getProfileSummary = require("../utils/cbm/profile/profileSummary");
const getProfileLoanInfo = require("../utils/cbm/profile/profileLoanInfo");
const getSummaryLoanInfo = require("../utils/cbm/profile/LoanInfo/loanInfoSummary");
const getInstlYrLoanInfo = require("../utils/cbm/profile/LoanInfo/loanInfoInstlYr");
const getApplicationLoanInfo = require("../utils/cbm/profile/LoanInfo/loanInfoApplication");
const getAccountsLoanInfo = require("../utils/cbm/profile/LoanInfo/loanInfoAccounts");
const getProfileScoring = require("../utils/cbm/profile/profileScoring");
const getProfileTradeReference = require("../utils/cbm/profile/profileTradeReference");
const getInstlYrTradeReference = require("../utils/cbm/profile/TradeReference/tradeReferenceInstlYr");
const getSubAccountAccounts = require("../utils/cbm/profile/LoanInfo/SubAccount/AccountsSubAccount");
const getMColAccounts = require("../utils/cbm/profile/LoanInfo/MCol/accountsMCol");
const getSubAccountInstlArr = require("../utils/cbm/profile/LoanInfo/SubAccount/accountsInstlArr");
const getSubAccountScols = require("../utils/cbm/profile/LoanInfo/SubAccount/accountScols");
const specAttnAcs = require("../utils/cbm/profile/LoanInfo/SpecAttnAcs/specAttnAcs");
const readS3 = require("../utils/readS3");

module.exports = async function insertDBXML(nric, ReqNo) {
  let file;
  try {
    file = fs.readFileSync(`./xml/${nric}.xml`, "utf-8");
  } catch (error) {
    console.log(error);
  }
  // let file

  // file = await readS3(nric)

  // console.log('cbmfinalresult', file)

  // const today = moment(new Date()).format('YYYY-MM-DD')

  let header = await getHeader(file, nric);
  let sqlHeader = `INSERT INTO ${process.env.CREDITMODEL}.cbm_header 
  (NRIC, SystemID, Service, ReportType, ReportTitle, MemberID, UserID, ReqNo,
    SequenceNo, ReqDate, PurposeSTDCode, Purpose, CostCenterSTD, CostCenter, TradeAvailable,
    ResponseDate, Warning, Errors, CreatedAt) 
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

  let itemHeader;
  try {
    itemHeader = await connection.insert(sqlHeader, header);
    console.log("itemHeader", itemHeader);
  } catch (error) {
    console.log(error);
  }

  let profile = await getProfile(file, nric, ReqNo);
  let sqlProfile = `INSERT INTO ${process.env.CREDITMODEL}.cbm_profile 
    (Name, IdNo, IdNo2, Dob, ConstitutionTypeStdCode, ConstitutionType, 
    Nationality, NationalityStdCode, ResidencyDesc, CCRISProfilesID, 
    SummaryID, LoanInfoID, ScoringID, TradeReferenceID, LitigationID, CreatedAt, ReqNo) 
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

  let itemProfile;
  try {
    itemProfile = await connection.insert(sqlProfile, profile.arr);
    console.log("itemProfile", itemProfile);
  } catch (error) {
    console.log(error);
  }

  let profileSummary = await getProfileSummary(
    file,
    nric,
    profile.SummaryID,
    ReqNo
  );
  let sqlSummary = `INSERT INTO ${process.env.CREDITMODEL}.cbm_profile_summary
    (NRIC, SummaryId, OthTotalNo, OwnTotalNo, TotalPrevEnqFI, TotalPrevEnqNonFI, CreatedAt, ReqNo) 
    VALUES (?,?,?,?,?,?,?,?)`;

  let itemSummary;
  try {
    itemSummary = await connection.insert(sqlSummary, profileSummary);
    console.log("itemSummary", itemSummary);
  } catch (error) {
    console.log(error);
  }

  //LoanInfo
  let profileLoanInfo = await getProfileLoanInfo(
    file,
    nric,
    profile.LoanInfoId,
    ReqNo
  );
  let sqlprofileLoanInfo = `INSERT INTO ${process.env.CREDITMODEL}.cbm_profile_loaninfo
     (NRIC, LoanId, Warning, SummaryId, InstlYrId, TotalBalance, TotalLimit, ApplicationsID, SpecAttnAccs, CreatedAt, ReqNo) 
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`;

  let itemProfileLoanInfo;
  try {
    itemProfileLoanInfo = await connection.insert(
      sqlprofileLoanInfo,
      profileLoanInfo.arr
    );
    console.log("itemProfileLoanInfo", itemProfileLoanInfo);
  } catch (error) {
    console.log(error);
  }

  let loanInfoSummary = await getSummaryLoanInfo(
    file,
    nric,
    profileLoanInfo.LoanSummaryId,
    ReqNo
  );
  let sqlloanInfoSummary = `INSERT INTO ${process.env.CREDITMODEL}.cbm_loaninfo_summary
     (NRIC, LoanID, ApprovedApp_No, ApprovedApp_TotalAmount, PendingApp_No, PendingApp_TotalAmt,
     Borrower_Outstanding, Borrower_Limit, Borrower_Fec, Guarantor_Limit, Guarantor_Fec, Total_Limit,
     Total_Fec, LegSts, SpecAttn, CreatedAt, ReqNo) 
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

  let itemLoanInfoSummary;
  try {
    itemLoanInfoSummary = await connection.insert(
      sqlloanInfoSummary,
      loanInfoSummary
    );
    console.log("itemLoanInfoSummary", itemLoanInfoSummary);
  } catch (error) {
    console.log(error);
  }

  let loanInfoInstlYr = await getInstlYrLoanInfo(
    file,
    nric,
    profileLoanInfo.InstlYrId,
    ReqNo
  );
  let sqlloanInfoInstlYr = `INSERT INTO ${process.env.CREDITMODEL}.cbm_loaninfo_instlyr
     (NRIC, InstlYrID, Y1, Y2, M1, M2, M3, M4, M5, M6, M7, M8, M9, M10, M11, M12, CreatedAt, ReqNo) 
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

  let itemLoanInfoInstlYr;
  try {
    itemLoanInfoInstlYr = await connection.insert(
      sqlloanInfoInstlYr,
      loanInfoInstlYr
    );
    console.log("itemLoanInfoInstlYr", itemLoanInfoInstlYr);
  } catch (error) {
    console.log(error);
  }

  let loanInfoApplication = await getApplicationLoanInfo(
    file,
    nric,
    profileLoanInfo.ApplicationId,
    ReqNo
  );
  let sqlLoanInfoApp = "";
  for (let i = 0; i < loanInfoApplication.length; i++) {
    if (i == loanInfoApplication.length - 1) {
      sqlLoanInfoApp += `('${loanInfoApplication[i][0]}', ${loanInfoApplication[i][1]}, '${loanInfoApplication[i][2]}', '${loanInfoApplication[i][3]}', '${loanInfoApplication[i][4]}', '${loanInfoApplication[i][5]}', '${loanInfoApplication[i][6]}', '${loanInfoApplication[i][7]}', '${loanInfoApplication[i][8]}', ${loanInfoApplication[i][9]}, '${loanInfoApplication[i][10]}', '${loanInfoApplication[i][11]}', '${loanInfoApplication[i][12]}', '${loanInfoApplication[i][13]}' )`;
    } else {
      sqlLoanInfoApp += `('${loanInfoApplication[i][0]}', ${loanInfoApplication[i][1]}, '${loanInfoApplication[i][2]}', '${loanInfoApplication[i][3]}', '${loanInfoApplication[i][4]}', '${loanInfoApplication[i][5]}', '${loanInfoApplication[i][6]}', '${loanInfoApplication[i][7]}', '${loanInfoApplication[i][8]}', ${loanInfoApplication[i][9]}, '${loanInfoApplication[i][10]}', '${loanInfoApplication[i][11]}', '${loanInfoApplication[i][12]}', '${loanInfoApplication[i][13]}' ),`;
    }
  }
  let sqlLoanInfoAppQuery = `INSERT INTO ${process.env.CREDITMODEL}.cbm_loaninfo_applications
  (NRIC, ApplicationId, No, DATE, AppTyp, StsStdCode, Sts, Capacity, LenderType, AmtAppl, MyFgn, Facility, CreatedAt, ReqNo) 
  VALUES ${sqlLoanInfoApp}`;

  let itemLoanInfoApp;
  try {
    itemLoanInfoApp = await connection.execute(sqlLoanInfoAppQuery);
    console.log("itemLoanInfoApp", itemLoanInfoApp);
  } catch (error) {
    console.log(error);
  }

  let loanInfoAccounts = await getAccountsLoanInfo(
    file,
    nric,
    profileLoanInfo.AccountId,
    ReqNo
  );
  let result = loanInfoAccounts.arr;
  let sql = "";
  for (let i = 0; i < result.length; i++) {
    if (i == result.length - 1) {
      sql += `('${result[i][0]}', ${result[i][1]}, '${result[i][2]}', '${result[i][3]}', '${result[i][4]}', '${result[i][5]}', ${result[i][6]}, '${result[i][7]}', '${result[i][8]}', '${result[i][9]}', '${result[i][10]}', ${result[i][11]}, '${result[i][12]}', '${result[i][13]}', '${result[i][14]}' )`;
    } else {
      sql += `('${result[i][0]}', ${result[i][1]}, '${result[i][2]}', '${result[i][3]}', '${result[i][4]}', '${result[i][5]}', ${result[i][6]}, '${result[i][7]}', '${result[i][8]}', '${result[i][9]}', '${result[i][10]}', ${result[i][11]}, '${result[i][12]}', '${result[i][13]}', '${result[i][14]}' ),`;
    }
  }

  let loanInfo = `INSERT INTO ${process.env.CREDITMODEL}.cbm_loaninfo_accounts
    (NRIC, AccountID, No, ApprovedDate, Capacity, LenderType, \`Limit\`, LegSts, LegStsStdCode, LegDate, MyFgn, SubAccID, MColsId, CreatedAt, ReqNo) 
    VALUES ${sql}`;

  let itemLoanInfo;
  try {
    itemLoanInfo = await connection.execute(loanInfo);
    console.log("itemLoanInfo", itemLoanInfo);
  } catch (error) {
    console.log(error);
  }

  let accountMcol = await getMColAccounts(
    file,
    nric,
    loanInfoAccounts.mcol,
    ReqNo
  );
  let sqlAccountMcol = "";
  for (let i = 0; i < accountMcol.length; i++) {
    if (i == accountMcol.length - 1) {
      sqlAccountMcol += `('${accountMcol[i].nric}', ${accountMcol[i].AccountsId}, '${accountMcol[i].MColTypStdCode}', '${accountMcol[i].MColTyp}', '${accountMcol[i].MColVal}', '${accountMcol[i].CreatedAt}', '${accountMcol[i].ReqNo}')`;
    } else {
      sqlAccountMcol += `('${accountMcol[i].nric}', ${accountMcol[i].AccountsId}, '${accountMcol[i].MColTypStdCode}', '${accountMcol[i].MColTyp}', '${accountMcol[i].MColVal}', '${accountMcol[i].CreatedAt}', '${accountMcol[i].ReqNo}'),`;
    }
  }

  let sqlAccountMColQuery = `INSERT INTO ${process.env.CREDITMODEL}.cbm_accounts_mcol
    (NRIC, AccountsID, MColTypStdCode, MColTyp, MColVal, CreatedAt, ReqNo) 
    VALUES ${sqlAccountMcol}`;

  let itemAccountMCol;
  try {
    itemAccountMCol = await connection.execute(sqlAccountMColQuery);
    console.log("itemAccountMcol", itemAccountMCol);
  } catch (error) {
    console.log(error);
  }

  let accountsSubAccount = await getSubAccountAccounts(
    file,
    nric,
    loanInfoAccounts.subAcc,
    ReqNo
  );
  let accountsSubAcc = accountsSubAccount.arr;
  let sqlAccountsSubAcc = "";
  for (let i = 0; i < accountsSubAcc.length; i++) {
    if (i == accountsSubAcc.length - 1) {
      sqlAccountsSubAcc += `('${accountsSubAcc[i].nric}', ${accountsSubAcc[i].AccountId}, '${accountsSubAcc[i].AccStsStdCode}', '${accountsSubAcc[i].AccSts}', '${accountsSubAcc[i].FacilityStdCode}', '${accountsSubAcc[i].Facility}', '${accountsSubAcc[i].TotalOutstanding}', '${accountsSubAcc[i].CrPosDate}', '${accountsSubAcc[i].RepayTermStdCode}', '${accountsSubAcc[i].RepayTerm}', '${accountsSubAcc[i].InstlAmt}', '${accountsSubAcc[i].ReschDat}', '${accountsSubAcc[i].RestrucDat}', '${accountsSubAcc[i].ScolsId}', '${accountsSubAcc[i].InstlArr}', '${accountsSubAcc[i].CreatedAt}', '${accountsSubAcc[i].ReqNo}' )`;
    } else {
      sqlAccountsSubAcc += `('${accountsSubAcc[i].nric}', ${accountsSubAcc[i].AccountId}, '${accountsSubAcc[i].AccStsStdCode}', '${accountsSubAcc[i].AccSts}', '${accountsSubAcc[i].FacilityStdCode}', '${accountsSubAcc[i].Facility}', '${accountsSubAcc[i].TotalOutstanding}', '${accountsSubAcc[i].CrPosDate}', '${accountsSubAcc[i].RepayTermStdCode}', '${accountsSubAcc[i].RepayTerm}', '${accountsSubAcc[i].InstlAmt}', '${accountsSubAcc[i].ReschDat}', '${accountsSubAcc[i].RestrucDat}', '${accountsSubAcc[i].ScolsId}', '${accountsSubAcc[i].InstlArr}', '${accountsSubAcc[i].CreatedAt}', '${accountsSubAcc[i].ReqNo}'),`;
    }
  }

  let accountSubQuery = `INSERT INTO ${process.env.CREDITMODEL}.cbm_accounts_subacc
    (NRIC, AccountsID, AccStsStdCode, AccSts, FacilityStdCode, Facility, 
      Total_Outstanding, CrPosDate, RepayTermStdCode, RepayTerm, InstlAmt, ReschDat, RestrucDat, SColsId, InstlArrId, CreatedAt, ReqNo) 
    VALUES ${sqlAccountsSubAcc}`;

  let itemAccountSub;

  try {
    itemAccountSub = await connection.execute(accountSubQuery);
    console.log("itemAccountSub", itemAccountSub);
  } catch (error) {
    console.log(error);
  }

  //specAttnAcc
  let specAttnAcc = await specAttnAcs(file, nric, ReqNo);
  let sqlSpecAttn = "";

  for (let i = 0; i < specAttnAcc.length; i++) {
    if (i == specAttnAcc.length - 1) {
      sqlSpecAttn += `('${specAttnAcc[i].nric}','${specAttnAcc[i].ApprovedDate}', '${specAttnAcc[i].Capacity}', '${specAttnAcc[i].LenderType}', '${specAttnAcc[i].AccStsStdCode}', '${specAttnAcc[i].AccSts}', '${specAttnAcc[i].FacilityStdCode}', '${specAttnAcc[i].Facility}', '${specAttnAcc[i].CrPosDate}', '${specAttnAcc[i].LegStsStdCode}', '${specAttnAcc[i].LegSts}', '${specAttnAcc[i].LegDate}', '${specAttnAcc[i].CreatedAt}', '${specAttnAcc[i].ReqNo}')`;
    } else {
      sqlSpecAttn += `('${specAttnAcc[i].nric}','${specAttnAcc[i].ApprovedDate}', '${specAttnAcc[i].Capacity}', '${specAttnAcc[i].LenderType}', '${specAttnAcc[i].AccStsStdCode}', '${specAttnAcc[i].AccSts}', '${specAttnAcc[i].FacilityStdCode}', '${specAttnAcc[i].Facility}', '${specAttnAcc[i].CrPosDate}', '${specAttnAcc[i].LegStsStdCode}', '${specAttnAcc[i].LegSts}', '${specAttnAcc[i].LegDate}', '${specAttnAcc[i].CreatedAt}', '${specAttnAcc[i].ReqNo}'),`;
    }
  }

  let specAttnQuery = `INSERT INTO ${process.env.CREDITMODEL}.cbm_loaninfo_specAttn
 (NRIC, ApprovedDate, Capacity, LenderType, AccStsStdCode, AccSts, FacilityStdCode, Facility, CrPosDate, LegStsStdCode, LegSts, LegDate, CreatedAt, ReqNo)
 VALUES ${sqlSpecAttn}`;

  let insertSpecAttn;

  try {
    insertSpecAttn = await connection.execute(specAttnQuery);
    console.log("insertSpecAttn", insertSpecAttn);
  } catch (error) {
    console.log(error);
  }

  //subAcc
  let subAccInstlArr = await getSubAccountInstlArr(
    file,
    nric,
    accountsSubAccount.instlArr,
    ReqNo
  );
  let sqlSubAccInstlArr = "";
  for (let i = 0; i < subAccInstlArr.length; i++) {
    if (i == subAccInstlArr.length - 1) {
      sqlSubAccInstlArr += `('${subAccInstlArr[i].NRIC}', ${subAccInstlArr[i].InstlArrId}, '${subAccInstlArr[i].M1}', '${subAccInstlArr[i].M2}', '${subAccInstlArr[i].M3}', '${subAccInstlArr[i].M4}',  '${subAccInstlArr[i].M5}',  '${subAccInstlArr[i].M6}',  '${subAccInstlArr[i].M7}',  '${subAccInstlArr[i].M8}',  '${subAccInstlArr[i].M9}',  '${subAccInstlArr[i].M10}',  '${subAccInstlArr[i].M11}',  '${subAccInstlArr[i].M12}', '${subAccInstlArr[i].CreatedAt}', '${subAccInstlArr[i].ReqNo}')`;
    } else {
      sqlSubAccInstlArr += `('${subAccInstlArr[i].NRIC}', ${subAccInstlArr[i].InstlArrId}, '${subAccInstlArr[i].M1}', '${subAccInstlArr[i].M2}', '${subAccInstlArr[i].M3}', '${subAccInstlArr[i].M4}',  '${subAccInstlArr[i].M5}',  '${subAccInstlArr[i].M6}',  '${subAccInstlArr[i].M7}',  '${subAccInstlArr[i].M8}',  '${subAccInstlArr[i].M9}',  '${subAccInstlArr[i].M10}',  '${subAccInstlArr[i].M11}',  '${subAccInstlArr[i].M12}', '${subAccInstlArr[i].CreatedAt}', '${subAccInstlArr[i].ReqNo}'),`;
    }
  }

  let sqlSubAccInstlArrQuery = `INSERT INTO ${process.env.CREDITMODEL}.cbm_accounts_instlarr
    (NRIC, InstlArrID, M1, M2, M3, M4, M5, M6, M7, M8, M9, M10, M11, M12, CreatedAt, ReqNo) 
    VALUES ${sqlSubAccInstlArr}`;

  let itemSubAccInstlArr;
  try {
    itemSubAccInstlArr = await connection.execute(sqlSubAccInstlArrQuery);
    console.log("itemSubAccInstlArr", itemSubAccInstlArr);
  } catch (error) {
    console.log(error);
  }

  let subAccScols = await getSubAccountScols(
    file,
    nric,
    accountsSubAccount.scol,
    ReqNo
  );
  let sqlSubAccScols = "";
  for (let i = 0; i < subAccScols.length; i++) {
    if (i == subAccScols.length - 1) {
      sqlSubAccScols += `('${subAccScols[i].NRIC}', ${subAccScols[i].SColsID}, '${subAccScols[i].SColTypStdCode}', '${subAccScols[i].SColTyp}', '${subAccScols[i].SColVal}', '${subAccScols[i].CreatedAt}', '${subAccScols[i].ReqNo}')`;
    } else {
      sqlSubAccScols += `('${subAccScols[i].NRIC}', ${subAccScols[i].SColsID}, '${subAccScols[i].SColTypStdCode}', '${subAccScols[i].SColTyp}', '${subAccScols[i].SColVal}', '${subAccScols[i].CreatedAt}', '${subAccScols[i].ReqNo}'),`;
    }
  }
  let sqlSubAccScolsQuery = `INSERT INTO ${process.env.CREDITMODEL}.cbm_accounts_scols
    (NRIC, SColsID, SColTypStdCode, SColTyp, SColVal, CreatedAt, ReqNo) 
    VALUES ${sqlSubAccScols}`;

  let itemSubAccScols;

  try {
    itemSubAccScols = await connection.execute(sqlSubAccScolsQuery);
    console.log("itemSubAccScols", itemSubAccScols);
  } catch (error) {
    console.log(error);
  }

  //check accounts flow
  let profileScoring = await getProfileScoring(
    file,
    nric,
    profile.ScoringId,
    ReqNo
  );
  let sqlScoring = `INSERT INTO ${process.env.CREDITMODEL}.cbm_profile_scoring
    (NRIC, ScoringID, Grade, Score, PD, CreatedAt, ReqNo) 
    VALUES (?,?,?,?,?,?,?)`;

  let itemScoring;
  try {
    itemScoring = await connection.insert(sqlScoring, profileScoring);
    console.log("itemScoring", itemScoring);
  } catch (error) {
    console.log(error);
  }

  //TradeReference
  let profileTradeReference = await getProfileTradeReference(
    file,
    nric,
    profile.TradeReferenceId,
    ReqNo
  );
  let sqlTradeReference = `INSERT INTO ${process.env.CREDITMODEL}.cbm_profile_tradereference
    (NRIC, InstlYrID, TotalBalance, TotalLimit, IndustriesID, CreatedAt, ReqNo) 
    VALUES (?,?,?,?,?,?,?)`;
  let itemprofileTradeReference;

  try {
    itemprofileTradeReference = await connection.insert(
      sqlTradeReference,
      profileTradeReference.arr
    );
    console.log("itemprofileTradeReference", itemprofileTradeReference);
  } catch (error) {
    console.log(error);
  }

  let tradeReferenceInstlYr = await getInstlYrTradeReference(
    file,
    nric,
    profileTradeReference.tradeReferenceId,
    ReqNo
  );
  let sqltradeReferencecInstl = `INSERT INTO ${process.env.CREDITMODEL}.cbm_tradereference_instlyr
     (NRIC, InstlId, Y1, Y2, M1, M2, M3, M4, M5, M6, M7, M8, M9, M10, M11, M12, CreatedAt, ReqNo) 
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

  let itemTradeReferenceInstl;
  try {
    itemTradeReferenceInstl = await connection.insert(
      sqltradeReferencecInstl,
      tradeReferenceInstlYr
    );
    console.log("itemTradeReferenceInstl", itemTradeReferenceInstl);
  } catch (error) {
    console.log(error);
  }
};

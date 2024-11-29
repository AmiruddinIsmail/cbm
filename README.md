### CBM app

<Request>
    <SystemID>SCBS</SystemID>
    <Service>INDDTLRPTS</Service>
    <ReportType>{{ config('services.cbm.reportType') }}</ReportType>
    <MemberID>{{ config('services.cbm.memberId') }}</MemberID>
    <UserID>{{ config('services.cbm.userId') }}</UserID>
    <ReqNo>{{ $reqNo }}</ReqNo>
    <SequenceNo>{{ $sequenceNo }}</SequenceNo>
    <ReqDate>12/10/2023</ReqDate>
    <PurposeStdCode>CREREV</PurposeStdCode>
    <CostCenterStdCode></CostCenterStdCode>
    <ConsentFlag></ConsentFlag>
    <Subject>
        <IdNo1>123456123456</IdNo1>
        <IdNo2 />
        <Name>TEST 1</Name>
        <Dob>17/12/1982</Dob>
        <ConstitutionTypeStdCode>011</ConstitutionTypeStdCode>
        <ConstitutionType>Individual</ConstitutionType>
        <NationalityStdCode>MY</NationalityStdCode>
        <Nationality>MALAYSIA</Nationality>
        <EntityCode>9601234</EntityCode>
        <TradeEntityCode />
        <Warning>Pending Verification</Warning>
        <EmailAddr />
        <MobileNo />
    </Subject>
</Request>

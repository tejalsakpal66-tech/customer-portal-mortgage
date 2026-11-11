/* Application sections after "Your documents", rendered from the schemas
   below. Questions, option lists and show/hide rules mirror the live portal.

   Field types:
     yesno     boxed Yes/No question
     select    label-above dropdown            text / money / date / textarea
     duration  label + Years / Months pair     address   Eircode + 3 lines + Country + County
     question  plain question line             group     repeatable block ("Property 1", Add/Remove)
     count     dropdown that renders N blocks   info / note  static content
   Any field may have showIf: { f: name, is | in | notIn | filled } evaluated in its block,
   or { id: elementId, in: [...] } to read a field elsewhere on the page. */

window.PortalSections = (function () {
  var REQUIRED_MSG = "Field is required";

  // ---- Option lists (live portal) -----------------------------------------
  var O = {
    banks: ["BOI", "AIB", "PTSB", "An Post", "EBS", "N26", "Revolut", "Credit Union", "Cash", "Other"],
    lenders: ["BOI", "AIB", "PTSB", "Avant", "ICS", "Finance Ireland", "Haven Mortgages", "EBS", "Other"],
    contractTypes: ["Permanent", "Temporary", "Fixed Term", "Agency"],
    businessTypes: ["Contractor", "Sole Trader", "Company Director"],
    contractorTypes: [
      "Contracting through your own limited company", "Contracting through an umbrella company", "Contracting as a sole trader",
    ],
    payFrequencies: ["Every Week", "Every Fortnight", "Every 4 Weeks", "Every Month", "Other"],
    incomeTypes: [
      "Overtime", "Bonus", "Commission", "Disability Benefit", "Incoming Rent", "Company dividend", "Second Job",
      "Car allowance", "Shift allowance", "Travel allowance", "Location allowance", "Maintenance", "Other",
    ],
    propertyTypes: ["House", "Apartment"],
    ownership: ["Own property with a mortgage", "Own property outright (without a mortgage)"],
    repayment: ["Interest and Capital Repayments", "Interest Only Repayments"],
    assetTypes: ["Excess money retained in current account", "Savings", "Shares", "Bonds", "Other"],
    savingsFrequency: ["Lump Sum", "Weekly", "Fortnightly", "Monthly", "Annually", "Ad Hoc"],
    commitmentTypes: ["Rent", "Personal loan", "Car loan", "Credit Card", "Overdraft", "PCP", "Other"],
    newPropertyTypes: ["House", "Apartment", "Self Build", "Other"],
    bedrooms: ["Studio", "1 Bed", "2 Bed", "3 Bed", "4 Bed", "5+ Bed"],
    ber: ["Don't know", "No rating", "Exempt", "A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D1", "D2", "E1", "E2", "F", "G"],
    sourceOfFunds: ["Inheritance", "Gift", "Help to Buy Scheme", "Other"],
    contactMethods: ["Email", "Phone", "Text message"],
    childAges: ["<1"].concat(range(1, 25)),
    count0to10: range(0, 10),
    years: range(0, 40),
    loanTerms: range(5, 35).map(function (n) { return n + " years"; }),
    months: range(0, 11),
  };

  function range(a, b) {
    var out = [];
    for (var i = a; i <= b; i++) out.push(String(i));
    return out;
  }

  var WORKING_PAYE = ["PAYE", "Public Servant"];
  var MULTI_YEAR_INCOME = ["Overtime", "Bonus", "Commission", "Second Job"];
  var INCOME_DETAILS = ["Other", "Maintenance", "Disability Benefit"];

  // ---- Field shorthands ------------------------------------------------------
  function yn(name, q, o) { return assign({ type: "yesno", name: name, q: q, required: true }, o); }
  function sel(name, label, options, o) { return assign({ type: "select", name: name, label: label, options: options }, o); }
  function txt(name, label, o) { return assign({ type: "text", name: name, label: label }, o); }
  function money(name, label, o) { return assign({ type: "money", name: name, label: label }, o); }
  function date(name, label, o) { return assign({ type: "date", name: name, label: label }, o); }
  function area(name, label, o) { return assign({ type: "textarea", name: name, label: label }, o); }
  function dur(name, label, o) { return assign({ type: "duration", name: name, label: label }, o); }
  function addr(name, q, o) { return assign({ type: "address", name: name, q: q }, o); }
  function req(f) { f.required = true; return f; }
  function assign(a, b) { for (var k in b) a[k] = b[k]; return a; }
  function details(showIf) { return area("details", "Please provide details *", { required: true, showIf: showIf }); }

  // ---- Section schemas -------------------------------------------------------
  var SECTIONS = {
    income: {
      partTitles: ["Employment", "Income"],
      summary: "Income Details Summary",
      title: "Your income",
      desc: "Tell us about your source of income",
      parts: [
        [
          // PAYE / Public Servant
          req(sel("contractType", "What is your contract type? *", O.contractTypes, { showIf: { id: "employment-type", in: WORKING_PAYE } })),
          sel("monthsRemaining", "Months remaining", O.count0to10.concat(range(11, 36)), {
            showIf: { f: "contractType", in: ["Temporary", "Fixed Term", "Agency"] },
          }),
          req(txt("occupation", "What is your occupation? *")),
          req(txt("employer", "What is the name of your current employer? *", { showIf: { id: "employment-type", in: WORKING_PAYE } })),
          addr("employerAddress", "What is your employer's address?", { showIf: { id: "employment-type", in: WORKING_PAYE } }),
          req(date("startDate", "When did you start this employment? *", {
            hint: "If you can't remember your start date you will find it on your Employment Detail Summary.",
            showIf: { id: "employment-type", in: WORKING_PAYE },
          })),
          yn("firstJob", "Is this your first job? *", { showIf: { id: "employment-type", in: WORKING_PAYE } }),
          req(txt("prevEmployer", "What is the name of your previous employer? *", { showIf: { f: "firstJob", is: "no" } })),
          addr("prevEmployerAddress", "What is your previous employer's address?", { showIf: { f: "firstJob", is: "no" } }),
          req(date("prevStart", "When did you start this employment? *", { showIf: { f: "firstJob", is: "no" } })),
          req(date("prevEnd", "When did you end this employment? *", {
            hint: "Defaults to the start date of your current job. Adjust if you had a gap between jobs.",
            showIf: { f: "firstJob", is: "no" },
          })),
          yn("probation", "Are you in a probation period in your work?", { showIf: { id: "employment-type", in: WORKING_PAYE } }),
          date("probationEnd", "When does your probation period end?", { showIf: { f: "probation", is: "yes" } }),

          // Self employed
          req(sel("businessType", "What is your business type? *", O.businessTypes, { showIf: { id: "employment-type", in: ["Self Employed"] } })),
          req(sel("contractorType", "How are you operating as a contractor? *", O.contractorTypes, { showIf: { f: "businessType", is: "Contractor" } })),
          date("contractEnd", "When is your current contract due to end (based on date in contract)?", { showIf: { f: "businessType", is: "Contractor" } }),
          req(txt("ownership", "What % of the company do you own? *", { inputmode: "decimal", showIf: { f: "businessType", is: "Company Director" } })),
          req(txt("businessName", "What is the name of your business, including trading name? *", { showIf: { id: "employment-type", in: ["Self Employed"] } })),
          addr("businessAddress", "What is your business address?", { showIf: { id: "employment-type", in: ["Self Employed"] } }),
          req(txt("businessNature", "What is the nature of the business? *", { showIf: { id: "employment-type", in: ["Self Employed"] } })),
          req(date("established", "When was your business established? *", {
            hint: "If you can't remember when your business was established you will find it on your Employment Detail Summary.",
            showIf: { id: "employment-type", in: ["Self Employed"] },
          })),
          req(money("earnThisYear", "What will you earn this year? *", { showIf: { id: "employment-type", in: ["Self Employed"] } })),
          req(money("earnLastYear", "What did you earn last year? *", { showIf: { id: "employment-type", in: ["Self Employed"] } })),
          req(money("earnYearBefore", "What did you earn the year before that? *", { showIf: { id: "employment-type", in: ["Self Employed"] } })),
          yn("taxUpToDate", "Are your tax affairs up to date?", { showIf: { id: "employment-type", in: ["Self Employed"] } }),
          area("taxDetails", "Please provide more detail *", { required: true, showIf: { f: "taxUpToDate", is: "no" } }),
          req(txt("accountant", "What is the name of your accountant? *", { showIf: { id: "employment-type", in: ["Self Employed"] } })),
          addr("accountantAddress", "What is the address of your accountant?", { showIf: { id: "employment-type", in: ["Self Employed"] } }),
          txt("accountantPhone", "What is the contact number of your accountant?", { inputmode: "tel", showIf: { id: "employment-type", in: ["Self Employed"] } }),
        ],
        [
          req(money("grossIncome", "What is your gross annual income before bonuses, overtime, etc? *", { showIf: { id: "employment-type", in: WORKING_PAYE } })),
          req(sel("payFrequency", "What frequency do you get paid? *", O.payFrequencies, { showIf: { id: "employment-type", in: WORKING_PAYE } })),
          req(sel("incomeBank", "Into which institution is your income paid? *", O.banks)),
          req(txt("incomeBankOther", "Please provide details *", { showIf: { f: "incomeBank", is: "Other" } })),
          req(txt("incomeAccount", "What is the account number? *", { inputmode: "numeric", hint: "Your account number is the last 8 digits of your IBAN." })),
          req(txt("retireAge", "At what age do you expect to retire? *", { inputmode: "numeric" })),
          yn("hasOtherIncome", "Do you receive any additional source(s) of income (e.g. bonus, overtime, etc)?"),
          {
            type: "group", name: "otherIncomes", title: "Other Income", add: "Add another income", remove: "Remove Income",
            showIf: { f: "hasOtherIncome", is: "yes" },
            fields: [
              req(sel("incomeType", "Income Type *", O.incomeTypes)),
              req(txt("details", "Please provide details *", { showIf: { f: "incomeType", in: INCOME_DETAILS } })),
              req(money("perYear", "How much per year? *", { showIf: { f: "incomeType", notIn: MULTI_YEAR_INCOME.concat([""]) } })),
              req(money("currentYear", "Current year *", { showIf: { f: "incomeType", in: MULTI_YEAR_INCOME } })),
              req(money("lastYear", "Last year *", { showIf: { f: "incomeType", in: MULTI_YEAR_INCOME } })),
              money("twoYearsAgo", "2 years ago", { showIf: { f: "incomeType", in: MULTI_YEAR_INCOME } }),
              money("threeYearsAgo", "3 years ago", { showIf: { f: "incomeType", in: MULTI_YEAR_INCOME } }),
              yn("guaranteed", "Is this guaranteed?", { showIf: { f: "incomeType", in: MULTI_YEAR_INCOME } }),
              req(sel("bank", "Into which institution is your additional income paid? *", O.banks)),
              req(txt("account", "What is the account number? *", { inputmode: "numeric", hint: "The account number is the last 8 digits of the IBAN." })),
            ],
          },
        ],
      ],
    },

    "assets-and-savings": {
      partTitles: ["Property", "Savings and other assets"],
      summary: "Assets and Savings Summary",
      title: "Your assets and savings",
      desc: "Tell us about your assets & savings",
      parts: [
        [
          yn("hasProperty", "Do you have any property assets (including your family home if applicable?)"),
          {
            type: "group", name: "properties", title: "Property", add: "Add another property", remove: "Remove Property",
            showIf: { f: "hasProperty", is: "yes" },
            fields: [
              req(sel("propertyType", "What type of property is it? *", O.propertyTypes)),
              yn("sameAddress", "Same as your current address?"),
              addr("address", "What is the address? *", { showIf: { f: "sameAddress", is: "no" } }),
              yn("familyHome", "Is this your family home?"),
              req(sel("ownership", "Which of the following would best describe you? *", O.ownership)),
              req(money("value", "What is the estimated value? *", { showIf: { f: "ownership", filled: true } })),
              req(money("owed", "How much is still owed? *", { showIf: { f: "ownership", is: O.ownership[0] } })),
              dur("term", "How long is left on the loan term? *", { showIf: { f: "ownership", is: O.ownership[0] } }),
              money("rent", "How much rent do you get each month (if applicable)?", { showIf: { f: "ownership", filled: true } }),
              money("repayment", "How much is the monthly repayment?", { showIf: { f: "ownership", is: O.ownership[0] } }),
              req(sel("lender", "Who is the lender? *", O.lenders, { showIf: { f: "ownership", is: O.ownership[0] } })),
              req(txt("mortgageAccount", "What is the mortgage account number? *", { showIf: { f: "ownership", is: O.ownership[0] } })),
              req(sel("repaymentStructure", "What is the repayment structure? *", O.repayment, { showIf: { f: "ownership", is: O.ownership[0] } })),
              txt("interestRate", "What is the interest rate?", { inputmode: "decimal", showIf: { f: "ownership", is: O.ownership[0] } }),
            ],
          },
        ],
        [
          yn("hasOtherAssets", "Do you have any regular savings, cash savings, deposits, shares, bonds, other?"),
          {
            type: "group", name: "otherAssets", title: "Other Asset", add: "Add another asset", remove: "Remove Asset",
            showIf: { f: "hasOtherAssets", is: "yes" },
            fields: [
              req(sel("type", "Type *", O.assetTypes)),
              details({ f: "type", is: "Other" }),
              req(money("balance", "What is the current balance? *")),
              req(sel("bank", "What institution is it with? *", O.banks)),
              req(txt("bankOther", "Please provide details *", { showIf: { f: "bank", is: "Other" } })),
              req(txt("account", "What is the account number? *", { inputmode: "numeric" })),
              req(sel("frequency", "What is the savings frequency? *", O.savingsFrequency)),
              req(money("perWeek", "How much per week? *", { showIf: { f: "frequency", is: "Weekly" } })),
              req(money("perFortnight", "How much per fortnight? *", { showIf: { f: "frequency", is: "Fortnightly" } })),
              req(money("perMonth", "How much per month? *", { showIf: { f: "frequency", is: "Monthly" } })),
              req(money("perYear", "How much annually? *", { showIf: { f: "frequency", is: "Annually" } })),
            ],
          },
        ],
      ],
    },

    "financial-commitments": {
      partTitles: ["Dependants", "Other commitments"],
      summary: "Financial Commitments Summary",
      title: "Your financial commitments",
      desc: "Tell us about your financial commitments",
      parts: [
        [
          yn("hasDependants", "Do you have any dependants?"),
          {
            type: "count", name: "children", label: "How many dependant children?", options: O.count0to10, title: "Dependant child",
            showIf: { f: "hasDependants", is: "yes" },
            fields: [
              req(sel("age", "Dependant child {n} age *", O.childAges, { floating: true })),
            ],
            after: [
              req(money("childcare", "How much are your monthly childcare commitments? *")),
              txt("arrangements", "Can you share details about your childcare arrangements? e.g. do grandparents mind the children"),
              money("maintenance", "Do you pay maintenance, if so, how much is your monthly maintenance commitment?"),
              req(sel("childcareBank", "From which institution is this paid from? *", O.banks, { showIf: { f: "childcare", filled: true } })),
              req(txt("childcareAccount", "What is the account number? *", { inputmode: "numeric", showIf: { f: "childcare", filled: true } })),
            ],
          },
          {
            type: "count", name: "adults", label: "How many dependant adults? *", options: O.count0to10, title: "Dependant adult", required: true,
            showIf: { f: "hasDependants", is: "yes" },
            fields: [
              req(money("care", "How much are your monthly adult dependant care commitments? *")),
              req(sel("bank", "From which institution is this paid from? *", O.banks)),
              req(txt("account", "What is the account number? *", { inputmode: "numeric" })),
            ],
          },
        ],
        [
          yn("hasCommitments", "Do you have any other monthly financial commitments?"),
          {
            type: "note", text: "e.g. rent, loans, credit card, other", showIf: { f: "hasCommitments", is: "" },
          },
          {
            type: "group", name: "loans", title: "Commitment", add: "Add another commitment", remove: "Remove Commitment",
            showIf: { f: "hasCommitments", is: "yes" },
            fields: [
              req(sel("loanType", "What is it? *", O.commitmentTypes)),
              details({ f: "loanType", is: "Other" }),
              req(money("rent", "How much is your monthly rent? *", { showIf: { f: "loanType", is: "Rent" } })),
              req(sel("rentBank", "What institution is it with? *", O.banks, { showIf: { f: "loanType", is: "Rent" } })),
              req(txt("rentAccount", "What is the account number that Rent is paid from? *", { inputmode: "numeric", showIf: { f: "loanType", is: "Rent" } })),
              req(money("monthly", "How much is the monthly repayment? *", { showIf: { f: "loanType", in: ["Personal loan", "Car loan", "PCP", "Other"] } })),
              req(money("owed", "How much is still owed? *", { showIf: { f: "loanType", in: ["Personal loan", "Car loan", "PCP", "Other"] } })),
              dur("term", "How long is left on the loan term? *", { showIf: { f: "loanType", in: ["Personal loan", "Car loan", "PCP", "Other"] } }),
              req(money("balance", "What is the current balance? *", { showIf: { f: "loanType", in: ["Credit Card", "Overdraft"] } })),
              req(money("creditLimit", "What is the credit limit? *", { showIf: { f: "loanType", is: "Credit Card" } })),
              req(money("overdraftLimit", "What is the overdraft limit? *", { showIf: { f: "loanType", is: "Overdraft" } })),
              req(sel("bank", "What institution is it with? *", O.banks, { showIf: { f: "loanType", notIn: ["", "Rent"] } })),
              req(txt("cardNumber", "What is the credit card number? *", { inputmode: "numeric", hint: "The last 4 digits are enough.", showIf: { f: "loanType", is: "Credit Card" } })),
              yn("payOff", "Do you intend to pay this off in full before you drawdown your mortgage? *", { showIf: { f: "loanType", notIn: ["", "Rent"] } }),
            ],
          },
        ],
      ],
    },

    "mortgage-needs": {
      partTitles: ["Your new property"],
      summary: "Mortgage Needs Summary",
      title: "Your mortgage needs",
      desc: "Tell us about the property you want a mortgage for",
      parts: [
        [
          yn("chosen", "Have you chosen a property already?"),
          req(sel("propertyType", "What type of property is it? *", O.newPropertyTypes, { showIf: { f: "chosen", is: "yes" } })),
          req(sel("bedrooms", "How many bedrooms? *", O.bedrooms, { showIf: { f: "chosen", is: "yes" } })),
          addr("propertyAddress", "What is the property address? *", { showIf: { f: "chosen", is: "yes" } }),
          req(sel("ber", "What is the Building Energy Rating? *", O.ber, { showIf: { f: "chosen", is: "yes" } })),
          req(money("price", "What is the purchase price or estimated value? *", { showIf: { f: "chosen", filled: true } })),
          req(money("borrow", "How much are you looking to borrow? *", { showIf: { f: "chosen", filled: true } })),
          { type: "info", key: "borrowing", showIf: { f: "chosen", filled: true } },
          req(sel("term", "How long do you want to borrow the money for? *", O.loanTerms, {
            hint: "The loan term (how long you take to repay the mortgage) affects your monthly repayments. A longer term means lower monthly repayments.",
            showIf: { f: "chosen", filled: true },
          })),
          { type: "info", key: "deposit", showIf: { f: "borrow", filled: true } },
          req(sel("source", "What is the source of funds? *", O.sourceOfFunds, { showIf: { f: "chosen", filled: true } })),
          details({ f: "source", is: "Other" }),
          req(money("sourceAmount", "Amount *", { showIf: { f: "source", filled: true } })),
        ],
      ],
    },

    "mortgage-declarations": {
      partTitles: ["Your circumstances", "Declarations and consent"],
      summary: "Your mortgage declaration Summary",
      title: "Your mortgage declaration",
      desc: "Tell us about your mortgage declaration",
      parts: [
        [
          yn("vulnerable", "Do you: (a) have any hearing or visual impairments? (b) require any assistance with decision-making? have any mental disabilities or mental health concerns that may classify you as a vulnerable consumer? We ask these questions because we want to ensure that we provide you with the appropriate support and assistance tailored to your specific needs, as necessary."),
          area("vulnerableDetails", "Please provide details *", { required: true, showIf: { f: "vulnerable", is: "yes" } }),
          yn("health", "Do you have any health conditions that could potentially impact your ability to work in the future and make it difficult for you to meet the loan repayment requirements?"),
          area("healthDetails", "Please provide details *", { required: true, showIf: { f: "health", is: "yes" } }),
          yn("repossession", "Have you ever: (a) had a mortgage that resulted in the lender repossessing the property? (b) been or are you currently the subject of legal action by a bank or other financial institution for debt recovery? (c) been involved in a settlement that caused a loss to a bank? (d) applied for or utilized any of the following: Debt Relief Notice, Debt Settlement Arrangement, or Personal Insolvency Arrangement? (d) been declared bankrupt or are currently undergoing bankruptcy proceedings? (e) had a court order (judgment) for debt recovery granted against you, and is this order still outstanding?"),
          area("repossessionDetails", "Please provide details *", { required: true, showIf: { f: "repossession", is: "yes" } }),
        ],
        [
          yn("police", "In the past 5 years, have you received a formal police caution or been convicted of any crimes, or do you have any pending prosecutions?"),
          area("policeDetails", "Please provide details *", { required: true, showIf: { f: "police", is: "yes" } }),
          yn("adverse", "Have you had any adverse credit history in the past 5 years?"),
          area("adverseDetails", "Please provide details *", { required: true, showIf: { f: "adverse", is: "yes" } }),
          yn("arrears", "Have you ever been in arrears with your rent, mortgage payments or any other loans?"),
          area("arrearsDetails", "Please provide details *", { required: true, showIf: { f: "arrears", is: "yes" } }),
          yn("refused", "Have you been refused a mortgage on this or any other property?"),
          area("refusedDetails", "Please provide details *", { required: true, showIf: { f: "refused", is: "yes" } }),
          yn("changes", "Do you anticipate any upcoming changes in your circumstances that could impact your ability to make mortgage payments?"),
          area("changesDetails", "Please provide details *", { required: true, showIf: { f: "changes", is: "yes" } }),
          yn("verify", "Can you please verify that the information you provided is correct to the best of your knowledge and that all previous questions were answered truthfully? Additionally, please confirm that any future inquiries or requests for clarification will also be responded to with accurate information?"),
          area("verifyDetails", "Please provide details *", { required: true, showIf: { f: "verify", is: "no" } }),
          { type: "consent", name: "marketing", text: "I consent to receiving marketing communications from " + ((window.PortalBrand && window.PortalBrand.legalName) || "Figor") },
          req(sel("contact", "My preferred method of contact is: *", O.contactMethods)),
        ],
      ],
    },
  };

  var INFO = {
    borrowing:
      '<details class="info-panel"><summary>Deciding how much to borrow</summary><div class="info-panel__body">' +
      "<p>If you're still house-hunting or just starting the process, it can make sense to apply for the <strong>maximum amount</strong> you're eligible for. This gives you clarity on the maximum lenders will lend you. You can always borrow less, but you can't borrow more unless you go through the process again.</p>" +
      "<p>The maximum amount you can apply for is linked to your income:</p>" +
      "<ul><li><strong>First-time buyers</strong> – 4 times your gross salary</li><li><strong>Second-time buyers</strong> – 3.5 times your gross salary</li></ul>" +
      "<p>If there are 2 of you applying for the mortgage, then it is 4 (or 3.5) times your combined salary. When calculating your salary you can include things like Car Allowance, Shift Allowance etc if they are guaranteed.</p>" +
      "<p>In some cases, there are exceptions where someone might be able to borrow more than the 4 (or 3.5) multiples. Your advisor can explain this to you also.</p>" +
      "</div></details>",
    deposit: '<p class="deposit-note" data-deposit></p>',
  };

  // ---- Rendering --------------------------------------------------------------
  var uid = 0;
  function nextId(name) { uid += 1; return "f-" + String(name || "x").replace(/[^a-z0-9]/gi, "") + "-" + uid; }

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function showAttr(f) { return f.showIf ? " data-show='" + esc(JSON.stringify(f.showIf)) + "' hidden" : ""; }

  function optionsHtml(list, selected) {
    return '<option value=""></option>' + list.map(function (o) {
      return "<option" + (o === selected ? " selected" : "") + ">" + esc(o) + "</option>";
    }).join("");
  }

  function hintHtml(f) { return f.hint ? '<p class="field-hint">' + esc(f.hint) + "</p>" : ""; }

  function control(f, id) {
    var common = ' id="' + id + '" data-field="' + f.name + '"' + (f.required ? " required" : "");
    switch (f.type) {
      case "select":
        return '<div class="lf__control lf__control--select"><select' + common + ">" + optionsHtml(f.options, f.value) + "</select></div>";
      case "textarea":
        return '<div class="lf__control"><textarea rows="4"' + common + "></textarea></div>";
      case "date":
        return '<div class="lf__control"><input type="date"' + common + "></div>";
      case "money":
        return '<div class="lf__control"><input type="text" inputmode="decimal" data-money' + common + "></div>";
      default:
        return '<div class="lf__control"><input type="text"' + (f.inputmode ? ' inputmode="' + f.inputmode + '"' : "") + common + "></div>";
    }
  }

  function fieldHtml(f, n) {
    var id = nextId(f.name);
    var label = (f.label || "").replace("{n}", n || "");
    switch (f.type) {
      case "yesno":
        var gname = id;
        return '<div class="yes-no" role="radiogroup" aria-labelledby="' + id + '-q"' + (f.required ? " data-required" : "") + showAttr(f) + ">" +
          '<p class="yes-no__question" id="' + id + '-q">' + esc(f.q) + "</p>" +
          '<div class="yes-no__options">' +
          '<label class="yes-no__option"><input type="radio" name="' + gname + '" value="yes" data-field="' + f.name + '"><span>Yes</span></label>' +
          '<label class="yes-no__option"><input type="radio" name="' + gname + '" value="no" data-field="' + f.name + '"><span>No</span></label>' +
          "</div></div>";
      case "duration":
        return '<div class="duration"' + showAttr(f) + '><p class="lf-group__label">' + esc(label) + "</p>" +
          '<div class="form-grid-2">' +
          '<div class="tf"><input id="' + id + '-y" type="text" inputmode="numeric" maxlength="2" data-field="' + f.name + 'Years" required><label for="' + id + '-y">Years</label></div>' +
          '<div class="tf tf--select"><select id="' + id + '-m" data-field="' + f.name + 'Months">' + optionsHtml(O.months, "0") + '</select><label for="' + id + '-m">Months</label></div>' +
          "</div></div>";
      case "address":
        return '<div class="address-block"' + showAttr(f) + ' data-scope-lite><p class="form-question">' + esc(f.q) + "</p>" +
          '<div class="form-stack form-stack--lf">' +
          fieldHtml(txt(f.name + "Eircode", "Eircode")) +
          fieldHtml(req(txt(f.name + "Line1", "Address line 1 *"))) +
          fieldHtml(txt(f.name + "Line2", "Address line 2")) +
          fieldHtml(txt(f.name + "Line3", "Address line 3")) +
          fieldHtml(req(sel(f.name + "Country", "Country *", window.PortalOptions.countries, { value: "Ireland" }))) +
          fieldHtml(req(sel(f.name + "County", "County *", window.PortalOptions.counties))) +
          "</div></div>";
      case "question":
        return '<p class="form-question"' + showAttr(f) + ">" + esc(f.text) + "</p>";
      case "note":
        return '<p class="field-hint"' + showAttr(f) + ">" + esc(f.text) + "</p>";
      case "info":
        return '<div class="info-slot"' + showAttr(f) + ">" + INFO[f.key] + "</div>";
      case "consent":
        return '<label class="checkbox consent"' + showAttr(f) + '><input type="checkbox" data-field="' + f.name + '">' + esc(f.text) + "</label>";
      case "group":
        return '<div class="repeat" data-repeat="' + f.name + '"' + showAttr(f) + ">" +
          '<div class="repeat__items"></div>' +
          '<div class="repeat__actions">' +
          '<button class="btn btn--outline btn--sm" type="button" data-repeat-add>' + esc(f.add) + "</button>" +
          '<button class="btn btn--outline btn--sm" type="button" data-repeat-remove>' + esc(f.remove) + "</button>" +
          "</div></div>";
      case "count":
        return '<div class="count-group" data-count-group="' + f.name + '"' + showAttr(f) + ">" +
          '<div class="lf"><label for="' + id + '">' + esc(f.label) + "</label>" +
          '<div class="lf__control lf__control--select"><select id="' + id + '" data-field="' + f.name + 'Count" data-count-select' + (f.required ? " required" : "") + ">" +
          optionsHtml(f.options) + "</select></div></div>" +
          '<div class="count-group__items"></div></div>';
      default:
        if (f.floating) {
          return '<div class="tf tf--select"' + showAttr(f) + '><select id="' + id + '" data-field="' + f.name + '"' + (f.required ? " required" : "") + ">" +
            optionsHtml(f.options) + '</select><label for="' + id + '">' + esc(label) + "</label></div>";
        }
        return '<div class="lf"' + showAttr(f) + '><label for="' + id + '">' + esc(label) + "</label>" + control(f, id) + hintHtml(f) + "</div>";
    }
  }

  function fieldsHtml(fields, n) {
    return fields.map(function (f) { return fieldHtml(f, n); }).join("");
  }

  function blockHtml(title, n, fields) {
    return '<div class="repeat__item" data-scope><p class="group-title">' + esc(title) + " " + n + "</p>" +
      '<div class="form-stack form-stack--lf">' + fieldsHtml(fields, n) + "</div></div>";
  }

  function footerHtml(showBack) {
    return '<div class="form-card__footer">' +
      (showBack ? '<button class="btn btn--back" type="button" data-part-back><span class="ms" aria-hidden="true">arrow_back</span> Back</button>' : "") +
      '<button class="btn btn--primary btn--next" type="submit">Next <span class="ms" aria-hidden="true">arrow_forward</span></button></div>';
  }

  function renderSection(name) {
    var s = SECTIONS[name];
    var card = document.createElement("section");
    card.className = "form-card section-card";
    card.setAttribute("data-section", name);
    card.hidden = true;
    card.innerHTML =
      '<h2 class="form-card__title">' + esc(s.title) + "</h2>" +
      '<p class="form-card__desc">' + esc(s.desc) + "</p>" +
      '<div class="part-progress" data-part-progress hidden></div>' +
      s.parts.map(function (fields, i) {
        return '<form class="section-part" data-part="' + (i + 1) + '" novalidate' + (i ? " hidden" : "") + ">" +
          '<div class="form-stack form-stack--lf section-part__fields">' + fieldsHtml(fields) + "</div>" +
          footerHtml(i > 0) + "</form>";
      }).join("");
    wireSection(card, s);
    renderPartProgress(card, 1, partTitlesOf(s));
    return card;
  }

  // ---- Part progress ("Part 2 of 4 · Income") -------------------------------------
  function partTitlesOf(s) {
    return s.parts.map(function (_, i) { return (s.partTitles && s.partTitles[i]) || "Part " + (i + 1); });
  }

  // Segmented bar + label under a card's heading; hidden for single-part cards.
  function renderPartProgress(card, n, titles) {
    var el = card.querySelector("[data-part-progress]");
    if (!el) return;
    var total = titles.length;
    el.hidden = total < 2;
    if (total < 2) return;
    el.innerHTML =
      '<div class="part-progress__bar" aria-hidden="true">' +
        titles.map(function (_, i) {
          var cls = i + 1 < n ? " is-done" : i + 1 === n ? " is-current" : "";
          return '<span class="part-progress__seg' + cls + '"></span>';
        }).join("") +
      "</div>" +
      '<p class="part-progress__label">Part ' + n + " of " + total +
        '<span class="part-progress__name"> · ' + esc(titles[n - 1]) + "</span></p>";
  }

  // ---- Behaviour ----------------------------------------------------------------
  function valueOf(scope, field) {
    var els = scope.querySelectorAll('[data-field="' + field + '"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.type === "radio") { if (el.checked) return el.value; continue; }
      if (el.type === "checkbox") return el.checked ? "yes" : "";
      return el.value;
    }
    return "";
  }

  function lookup(el, rule) {
    if (rule.id) {
      var target = document.getElementById(rule.id);
      return target ? target.value : "";
    }
    var scope = el.parentElement.closest("[data-scope]") || el.closest("form");
    return valueOf(scope, rule.f);
  }

  function matches(value, rule) {
    if (rule.filled) return value !== "" && value !== undefined;
    if ("is" in rule) return value === rule.is;
    if (rule.in) return rule.in.indexOf(value) !== -1;
    if (rule.notIn) return rule.notIn.indexOf(value) === -1;
    return true;
  }

  function evaluate(root) {
    // Repeat until stable so chains of conditions settle.
    for (var pass = 0; pass < 4; pass++) {
      var changed = false;
      root.querySelectorAll("[data-show]").forEach(function (el) {
        var rule = JSON.parse(el.getAttribute("data-show"));
        var show = matches(lookup(el, rule), rule);
        if (el.hidden === show) { el.hidden = !show; changed = true; }
      });
      if (!changed) break;
    }
    root.querySelectorAll(".tf input, .tf select").forEach(function (el) {
      el.closest(".tf").classList.toggle("is-filled", el.value !== "");
    });
    updateDeposit(root);
  }

  function formatMoney(el) {
    var n = parseFloat(String(el.value).replace(/[^0-9.]/g, ""));
    el.value = isNaN(n) ? "" : "€" + n.toLocaleString("en-IE", { maximumFractionDigits: 2 });
  }

  function moneyValue(scope, field) {
    var n = parseFloat(String(valueOf(scope, field)).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }

  function updateDeposit(root) {
    var note = root.querySelector("[data-deposit]");
    if (!note) return;
    var form = note.closest("form");
    var price = moneyValue(form, "price");
    var borrow = moneyValue(form, "borrow");
    var fmt = function (n) { return "€" + Math.max(0, Math.round(n)).toLocaleString("en-IE"); };
    var stamp = price * 0.01;
    var legal = price ? 2500 : 0;
    note.innerHTML = "Based on the amount you want to borrow you will need a deposit of <strong>" + fmt(price - borrow) +
      "</strong> and an additional amount of approximately <strong>" + fmt(stamp + legal) +
      "</strong>, which consists of stamp duty (" + fmt(stamp) + ") and estimated legal fees (" + fmt(legal) + ").";
  }

  function addBlock(repeat, def) {
    var items = repeat.querySelector(".repeat__items");
    var n = items.children.length + 1;
    items.insertAdjacentHTML("beforeend", blockHtml(def.title, n, def.fields));
    syncRepeatButtons(repeat);
  }

  function syncRepeatButtons(repeat) {
    repeat.querySelector("[data-repeat-remove]").hidden = repeat.querySelector(".repeat__items").children.length <= 1;
  }

  function renderCount(group, def) {
    var items = group.querySelector(".count-group__items");
    var n = parseInt(group.querySelector("[data-count-select]").value, 10) || 0;
    var have = items.children.length;
    for (var i = have; i < n; i++) items.insertAdjacentHTML("beforeend", blockHtml(def.title, i + 1, def.fields));
    while (items.children.length > n) items.lastElementChild.remove();
    if (def.after) {
      var after = group.querySelector(".count-group__after");
      if (n > 0 && !after) {
        items.insertAdjacentHTML("afterend", '<div class="count-group__after form-stack form-stack--lf" data-scope>' + fieldsHtml(def.after) + "</div>");
      } else if (n === 0 && after) {
        after.remove();
      }
    }
  }

  function findDef(fields, name) {
    for (var i = 0; i < fields.length; i++) if (fields[i].name === name) return fields[i];
    return null;
  }

  function wireSection(card, s) {
    var parts = card.querySelectorAll(".section-part");

    parts.forEach(function (form, i) {
      var fields = s.parts[i];
      form.querySelectorAll("[data-repeat]").forEach(function (repeat) {
        addBlock(repeat, findDef(fields, repeat.getAttribute("data-repeat")));
      });

      form.addEventListener("click", function (e) {
        var add = e.target.closest("[data-repeat-add]");
        var remove = e.target.closest("[data-repeat-remove]");
        if (add || remove) {
          var repeat = (add || remove).closest("[data-repeat]");
          var def = findDef(fields, repeat.getAttribute("data-repeat"));
          if (add) addBlock(repeat, def);
          else { repeat.querySelector(".repeat__items").lastElementChild.remove(); syncRepeatButtons(repeat); }
          evaluate(form);
        }
        if (e.target.closest("[data-part-back]")) showPart(card, i);
      });

      form.addEventListener("change", function (e) {
        var countSel = e.target.closest("[data-count-select]");
        if (countSel) {
          var group = countSel.closest("[data-count-group]");
          renderCount(group, findDef(fields, group.getAttribute("data-count-group")));
        }
        if (e.target.matches("[data-money]")) formatMoney(e.target);
        clearError(e.target);
        evaluate(form);
      });

      form.addEventListener("input", function (e) {
        clearError(e.target);
        if (e.target.closest(".tf")) e.target.closest(".tf").classList.toggle("is-filled", e.target.value !== "");
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validate(form)) return;
        if (i + 1 < parts.length) showPart(card, i + 2);
        else showSummary(card, s.summary);
      });

      evaluate(form);
    });
  }

  function showPart(card, n) {
    card.querySelectorAll(".section-part").forEach(function (form, i) { form.hidden = i + 1 !== n; });
    var sec = SECTIONS[card.getAttribute("data-section")];
    if (sec) renderPartProgress(card, n, partTitlesOf(sec));
    var top = card.getBoundingClientRect().top + window.scrollY - 140;
    if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  // ---- Summary ---------------------------------------------------------------------
  var PENCIL = '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zm17.7-10.2a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';

  function cleanLabel(t) {
    return String(t).replace(/\s*\*\s*$/, "").replace(/\s+/g, " ").trim();
  }

  function formatDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    return m ? m[3] + "-" + m[2] + "-" + m[1] : v;
  }

  function controlValue(el) {
    if (!el) return "";
    if (el.tagName === "SELECT") return el.value ? el.options[el.selectedIndex].text : "";
    if (el.type === "date") return formatDate(el.value);
    return el.value.trim();
  }

  // Turns the visible answers in the given forms into [{label, value}] /
  // [{group: title}] rows, in the order they appear.
  function collectRows(forms) {
    var rows = [];
    var SEL = ".yes-no, .lf, .tf, .duration, .address-block, .group-title, .consent";
    forms.forEach(function (form) {
      form.querySelectorAll(SEL).forEach(function (el) {
        // Ignore fields hidden inside the part (show/hide rules), not the part itself.
        for (var n = el; n && n !== form; n = n.parentElement) if (n.hidden) return;
        var push = function (row) {
          row.nested = !!el.closest(".repeat__item, .count-group__items");
          rows.push(row);
        };
        var parentBlock = el.parentElement && el.parentElement.closest(".address-block, .duration");
        if (parentBlock) return;
        if (el.classList.contains("group-title")) {
          if (!el.closest(".count-group__items")) rows.push({ group: el.textContent.trim() });
          return;
        }
        if (el.classList.contains("yes-no")) {
          var checked = el.querySelector("input:checked");
          if (checked) push({ label: cleanLabel(el.querySelector(".yes-no__question").textContent), value: checked.value === "yes" ? "Yes" : "No" });
          return;
        }
        if (el.classList.contains("consent")) {
          push({ label: cleanLabel(el.textContent), value: el.querySelector("input").checked ? "Yes" : "No" });
          return;
        }
        if (el.classList.contains("duration")) {
          var y = controlValue(el.querySelector("input"));
          var mo = controlValue(el.querySelector("select"));
          if (y || (mo && mo !== "0")) push({ label: cleanLabel(el.querySelector(".lf-group__label").textContent), value: (y || 0) + " years " + (mo || 0) + " months" });
          return;
        }
        if (el.classList.contains("address-block")) {
          var parts = Array.prototype.map.call(el.querySelectorAll("input, select"), controlValue).filter(Boolean);
          // Eircode first in the form; show it after the street lines like a postal address.
          if (parts.length > 1) parts.push(parts.shift());
          if (parts.length) push({ label: cleanLabel(el.querySelector(".form-question").textContent), value: parts.join(", ") });
          return;
        }
        var label = el.querySelector("label");
        var value = controlValue(el.querySelector("input, select, textarea"));
        if (label && value) push({ label: cleanLabel(label.textContent), value: value });
      });
    });
    return rows;
  }

  var ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  // Long questions stack (question above, answer below) instead of squeezing
  // into the label column; Yes/No answers show as small tags for scanning.
  var LONG_LABEL = 80;

  function answerHtml(value) {
    if (value === "Yes" || value === "No") {
      return '<span class="summary__answer summary__answer--' + value.toLowerCase() + '">' + value + "</span>";
    }
    return esc(value);
  }

  function rowsHtml(rows) {
    return rows.map(function (r) {
      if (r.group) return '<div class="summary__group">' + esc(r.group) + "</div>";
      var cls = "summary__row" +
        (r.nested ? " summary__row--nested" : "") +
        (r.label.length > LONG_LABEL ? " summary__row--stacked" : "");
      return '<div class="' + cls + '"><dt>' + esc(r.label) + "</dt><dd>" + answerHtml(r.value) + "</dd></div>";
    }).join("");
  }

  // blocks: [{ title, part, rows }]
  function summaryHtml(title, blocks) {
    return '<div class="summary">' +
      '<div class="summary__head"><div>' +
        '<h2 class="summary__title">' + esc(title) + "</h2>" +
        '<p class="summary__lede">Check your answers before you continue.</p>' +
      "</div>" +
      '<button class="btn btn--outline summary__edit" type="button" data-summary-edit="1">' + PENCIL + "Edit</button></div>" +
      blocks.filter(function (b) { return b.rows.length; }).map(function (b) {
        return '<section class="summary__block">' +
          '<header class="summary__block-head"><h3>' + esc(b.title) + "</h3>" +
          '<button class="summary__change" type="button" data-summary-edit="' + b.part + '">Change<span class="sr-only"> ' + esc(b.title.toLowerCase()) + "</span></button></header>" +
          '<dl class="summary__rows">' + rowsHtml(b.rows) + "</dl></section>";
      }).join("") +
      '<div class="summary__actions"><button class="btn btn--primary summary__continue" type="button" data-summary-continue>Continue ' + ARROW + "</button></div>" +
      "</div>";
  }

  // Shows a summary inside `card`, hiding its other content until edited.
  // onEdit(partNumber) reopens the form at that part.
  function mountSummary(card, title, blocks, onEdit, onContinue) {
    var old = card.querySelector(".summary");
    if (old) old.remove();
    card.insertAdjacentHTML("beforeend", summaryHtml(title, blocks));
    card.classList.add("is-summary");
    var box = card.querySelector(".summary");
    box.addEventListener("click", function (e) {
      var edit = e.target.closest("[data-summary-edit]");
      if (edit) {
        box.remove();
        card.classList.remove("is-summary");
        onEdit(parseInt(edit.getAttribute("data-summary-edit"), 10) || 1);
      }
      if (e.target.closest("[data-summary-continue]")) onContinue();
    });
    var top = card.getBoundingClientRect().top + window.scrollY - 140;
    if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function showSummary(card, title) {
    var name = card.getAttribute("data-section");
    var s = SECTIONS[name];
    window.PortalSections.markComplete(name);
    var blocks = Array.prototype.map.call(card.querySelectorAll(".section-part"), function (form, i) {
      return { title: (s.partTitles && s.partTitles[i]) || "Your answers", part: i + 1, rows: collectRows([form]) };
    });
    mountSummary(card, title, blocks,
      function (n) { showPart(card, n); },
      function () { window.goToNextSection(name); });
  }

  // ---- Validation ----------------------------------------------------------------
  function wrapperOf(el) { return el.closest(".tf, .lf, .yes-no"); }

  function showError(el) {
    var wrap = wrapperOf(el);
    if (!wrap || wrap.querySelector(".field-error")) { if (wrap) wrap.classList.add("has-error"); return; }
    var msg = document.createElement("p");
    msg.className = "field-error";
    msg.id = (el.id || nextId("err")) + "-error";
    msg.textContent = REQUIRED_MSG;
    wrap.appendChild(msg);
    wrap.classList.add("has-error");
    el.setAttribute("aria-invalid", "true");
    el.setAttribute("aria-describedby", msg.id);
  }

  function clearError(el) {
    var wrap = el && wrapperOf(el);
    if (!wrap) return;
    var msg = wrap.querySelector(".field-error");
    if (msg) msg.remove();
    wrap.classList.remove("has-error");
    wrap.querySelectorAll("[aria-invalid]").forEach(function (c) {
      c.removeAttribute("aria-invalid");
      c.removeAttribute("aria-describedby");
    });
  }

  function validate(form) {
    var first = null;
    form.querySelectorAll("input[required], select[required], textarea[required]").forEach(function (el) {
      if (el.closest("[hidden]")) return;
      if (!String(el.value).trim()) { showError(el); first = first || el; } else clearError(el);
    });
    form.querySelectorAll(".yes-no[data-required]").forEach(function (box) {
      if (box.closest("[hidden]")) return;
      var radio = box.querySelector("input");
      if (!box.querySelector("input:checked")) { showError(radio); first = first || radio; }
    });
    if (first) first.focus();
    return !first;
  }

  // ---- Application status page -------------------------------------------------------
  var CHEVRON_RIGHT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  var DOC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9 14l3-3 3 3"/></svg>';
  var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function renderStatus() {
    var card = document.createElement("section");
    card.className = "form-card status-page";
    card.setAttribute("data-section", "application-status");
    card.hidden = true;
    card.innerHTML =
      '<div class="status-hero">' +
        '<div class="status-page__chart" data-status-chart></div>' +
        '<div class="status-hero__text">' +
          '<p class="status-hero__eyebrow">Application progress</p>' +
          '<h2 class="status-page__headline">Your application is <span data-status-percent>0%</span> complete</h2>' +
          '<p class="status-page__lede" data-status-lede></p>' +
        "</div>" +
      "</div>" +
      '<section class="status-group" data-status-docs-group>' +
        '<header class="status-group__head"><h3 class="status-group__title">Documents to upload <span class="status-group__count" data-status-docs-count></span></h3>' +
        '<p class="status-group__hint">Select a document to see what\'s still needed.</p></header>' +
        '<div class="status-docs" data-status-docs></div>' +
      "</section>" +
      '<section class="status-group" data-status-sections-group>' +
        '<header class="status-group__head"><h3 class="status-group__title">Sections to finish <span class="status-group__count" data-status-sections-count></span></h3>' +
        '<p class="status-group__hint">Pick up any section where you left off.</p></header>' +
        '<div class="status-sections" data-status-sections></div>' +
      "</section>" +
      '<div class="status-page__actions">' +
        '<a class="btn btn--outline status-page__home" href="index.html">Back to dashboard</a>' +
        '<a class="btn btn--primary status-page__next" href="#" data-status-next>Continue application ' + ARROW + "</a>" +
      "</div>";
    return card;
  }

  function stepIcon(step) {
    var icon = step.querySelector(".step__icon");
    if (!icon) return "";
    var clone = icon.cloneNode(true);
    clone.classList.remove("step__icon");
    clone.classList.add("status-row__glyph");
    clone.removeAttribute("width");
    clone.removeAttribute("height");
    return clone.outerHTML;
  }

  function refreshStatus(card) {
    var progress = window.AppProgress.get() || 21;
    card.querySelector("[data-status-percent]").textContent = progress + "%";
    var R = 52, C = 2 * Math.PI * R;
    card.querySelector("[data-status-chart]").innerHTML =
      '<svg viewBox="0 0 124 124" role="img" aria-label="' + progress + '% complete">' +
      '<circle cx="62" cy="62" r="' + R + '" class="status-chart__track"/>' +
      '<circle cx="62" cy="62" r="' + R + '" class="status-chart__bar" stroke-dasharray="' + (C * progress) / 100 + " " + C + '" transform="rotate(-90 62 62)"/>' +
      '<text x="62" y="70" text-anchor="middle" class="status-chart__text">' + progress + "%</text></svg>";

    // Documents still to upload
    var docs = window.PortalDocs.outstanding();
    card.querySelector("[data-status-docs-count]").textContent = docs.length;
    card.querySelector("[data-status-docs]").innerHTML = docs.length
      ? docs.map(function (d) {
          return '<details class="status-doc"><summary>' +
            '<span class="status-doc__icon">' + DOC_ICON + "</span>" +
            '<span class="status-doc__name">' + esc(d.name) + "</span>" +
            '<span class="status-doc__chip">Needed</span>' +
            '<span class="ms status-doc__chevron" aria-hidden="true">expand_more</span></summary>' +
            '<div class="status-doc__body">' +
              (d.issues ? "<ul>" + d.issues.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "<p>This document still needs to be uploaded.</p>") +
              '<a class="btn btn--outline status-doc__upload" href="?section=documents" data-goto="documents">Upload files</a>' +
            "</div></details>";
        }).join("")
      : '<p class="status-empty"><span class="status-empty__icon">' + CHECK_ICON + "</span>All required documents are uploaded.</p>";

    // Sections still to finish
    var rows = document.querySelectorAll(".step[data-section]");
    var html = "";
    var count = 0;
    var firstOpen = null;
    rows.forEach(function (step) {
      var name = step.getAttribute("data-section");
      if (name === "application-status" || step.closest("[hidden]")) return;
      var ring = step.querySelector(".ring__value");
      var pct = ring ? parseInt(ring.textContent, 10) || 0 : 0;
      if (name === "documents") { // listed above
        if (docs.length) firstOpen = firstOpen || name;
        return;
      }
      if (pct >= 100 || step.classList.contains("is-done")) return;
      firstOpen = firstOpen || name;
      count++;
      var label = step.querySelector(".step__label").textContent.replace(/^Your application details$/, "Application details");
      html += '<a class="status-row" href="?section=' + name + '" data-goto="' + name + '">' +
        '<span class="status-row__icon">' + stepIcon(step) + "</span>" +
        '<span class="status-row__main"><span class="status-row__name">' + esc(label) + "</span>" +
          '<span class="status-row__progress"><span class="status-row__bar"><span style="width:' + pct + '%"></span></span>' +
          '<span class="status-row__pct">' + (pct ? pct + "%" : "Not started") + "</span></span></span>" +
        '<span class="status-row__cta">' + (pct ? "Continue" : "Start") + CHEVRON_RIGHT + "</span></a>";
    });
    card.querySelector("[data-status-sections-count]").textContent = count;
    card.querySelector("[data-status-sections]").innerHTML = html ||
      '<p class="status-empty"><span class="status-empty__icon">' + CHECK_ICON + "</span>Every section is complete.</p>";

    var parts = [];
    if (docs.length) parts.push(docs.length + (docs.length === 1 ? " document" : " documents") + " to upload");
    if (count) parts.push(count + (count === 1 ? " section" : " sections") + " to finish");
    card.querySelector("[data-status-lede]").textContent = parts.length
      ? "You have " + parts.join(" and ") + " before your specialist can review it."
      : "Everything is in. Your specialist will review your application next.";

    var next = card.querySelector("[data-status-next]");
    next.hidden = !firstOpen;
    if (firstOpen) {
      next.setAttribute("href", "?section=" + firstOpen);
      next.setAttribute("data-goto", firstOpen);
    }
  }

  // ---- Public API ------------------------------------------------------------------
  var completed = {};

  return {
    names: Object.keys(SECTIONS).concat(["application-status"]),
    titles: {
      income: "Your income",
      "assets-and-savings": "Your assets and savings",
      "financial-commitments": "Your financial commitments",
      "mortgage-needs": "Your mortgage needs",
      "mortgage-declarations": "Your mortgage declaration",
      "application-status": "Your application status",
    },
    mount: function (container) {
      Object.keys(SECTIONS).forEach(function (name) { container.appendChild(renderSection(name)); });
      var status = renderStatus();
      container.appendChild(status);
      status.addEventListener("click", function (e) {
        var link = e.target.closest("[data-goto]");
        if (link) { e.preventDefault(); window.goToSection(link.getAttribute("data-goto")); }
      });
    },
    onShow: function (name) {
      var card = document.querySelector('.form-card[data-section="' + name + '"]');
      if (!card) return;
      if (name === "application-status") refreshStatus(card);
      else {
        card.querySelectorAll(".section-part").forEach(evaluate);
        if (completed[name] && !card.classList.contains("is-summary")) showSummary(card, SECTIONS[name].summary);
      }
    },
    collectRows: collectRows,
    mountSummary: mountSummary,
    renderPartProgress: renderPartProgress,
    markComplete: function (name) {
      completed[name] = true;
      if (window.AppProgress) window.AppProgress.complete(name);
      var ring = document.querySelector('.step[data-section="' + name + '"] .ring');
      if (ring) ring.setAttribute("data-value", "100");
      if (window.refreshRings) window.refreshRings();
    },
    isComplete: function (name) { return !!completed[name]; },
  };
})();

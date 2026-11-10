/* Document types the applicant is asked for, in the two pages shown in the
   "Your documents" step. Shared by the application page (js/documents.js) and
   the dashboard's "action needed" banner. Content mirrors the live portal.

   percent: a number for required documents, or null for optional ones (the
   portal shows a blank "%" ring for those). */

window.PortalDocList = (function () {
  var PAGES = [
    [
      {
        name: "Personal Current Account(s) Statements",
        percent: 0,
        issues: ["You have not provided any current account statements. Please provide 6 months of up-to-date bank statements."],
        instruction: "Please upload your last 6 months consecutive current account statements, <strong>including any digital accounts such as Revolut.</strong>",
      },
      {
        name: "Personal Credit Card",
        percent: null,
        instruction: "Please upload your last 6 months consecutive personal credit card statements.",
      },
      {
        name: "Assets and Savings Accounts Statements",
        percent: null,
        instruction: "Please upload your last 6 months consecutive savings and deposit statements. Also, include any other statements relating to assets that evidence your deposit.",
      },
      {
        name: "Employment Detail Summary",
        percent: 0,
        issues: [
          "You have not uploaded the last year's Employment Details Summary. This does not meet lender requirements. Please upload the last year's Employment Details Summary in ‘Your documents’ section under ‘Employment Detail Summary’",
          "Tejal has not uploaded all EDS statements.",
          "Tejal has not uploaded the last year’s EDS.",
        ],
        instruction: "Provide last year’s EDS statement which can be obtained from Revenue Online. If you receive variable pay like bonuses, commission, overtime or if you have a 2nd job or are self employed you will need to provide the last 3 years EDS statements. Here is a step-by-step guide on how to access your EDS statements <a href=\"https://www.revenue.ie/en/jobs-and-pensions/end-of-year-process/employment-detail-summary.aspx\" target=\"_blank\" rel=\"noopener\">Employment Detail Summary (revenue.ie)</a>.",
      },
    ],
    [
      {
        name: "Loan Statements",
        percent: null,
        instruction: "Please upload your last 6 months consecutive loan statements for all loans held, including any that closed in the last 6 months.",
      },
      {
        name: "Photo Identification",
        percent: 0,
        images: true,
        issues: ["You have not provided photo identification which the Lenders require. Please upload your photo identification"],
        instruction: "Please upload a copy of your Passport or Driving Licence. Please include the photo page and opposite page for your passport. Please ensure all 4 corners of the document are included. We accept pdf, jpg, jpeg or png for this.",
      },
      {
        name: "Proof of Address",
        percent: 0,
        issues: ["You have not provided your proof of address. Please upload your proof of address using the link below."],
        instruction: "You can use your current account bank statements as evidence of your address - is the address on your current account bank statements the same as your current address?",
      },
      {
        name: "Irish Residence Permit / Immigration Stamp",
        percent: 0,
        instruction: "Please upload a copy of your Irish Residence Permit (IRP) or GNIB card showing your current immigration stamp (e.g. Stamp 4).",
      },
      {
        name: "General Uploads",
        percent: null,
        instruction: "Please upload documents here when requested by your advisor.",
      },
    ],
  ];

  // Required documents with nothing uploaded yet, given the uploads made in
  // this browser (UploadsStore records, matched by document name).
  function outstanding(uploads) {
    var have = {};
    (uploads || []).forEach(function (u) { have[u.doc] = true; });
    var out = [];
    PAGES.forEach(function (docs) {
      docs.forEach(function (d) {
        if (d.percent !== null && d.percent < 100 && !have[d.name]) out.push(d);
      });
    });
    return out;
  }

  return { pages: PAGES, outstanding: outstanding };
})();

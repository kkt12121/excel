const express = require("express");
const router = express.Router();
const models = require("../models");
const Excel = require("exceljs");
const moment = require("moment");
const { Op } = require("sequelize");
const parser = require("../modules/parser");
// const { saveAs } = require("file-saver");
const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  TextRun,
} = require("docx");
const fs = require("fs");

const formatDate = (date) => {
  const d = new Date(date);
  let month = `${d.getMonth() + 1}`;
  let day = `${d.getDate()}`;
  const year = d.getFullYear();
  if (month.length < 2) month = `0${month}`;
  if (day.length < 2) day = `0${day}`;
  return [year, month, day].join("-");
};

router.post("/diagnosis", async (req, res, next) => {
  const { index } = req.body;
  let num;
  let diagnosisNum;
  let diagnosisAnalysis;
  try {
    if (!index) return res.status(412).json("index error");

    const diagnosisInfo = await models.diagnosis.findOne({
      where: { id: index },
      include: [
        {
          model: models.clients,
          attributes: ["name"],
        },
        {
          model: models.paymentClient,
          attributes: ["createdAt"],
        },
      ],
    });

    const allDiagnosis = await models.diagnosis.findAll({
      where: { payment: 1 },
      include: [
        {
          model: models.paymentClient,
          where: { payMethod: "card" },
        },
      ],
    });

    await Promise.all(
      allDiagnosis.map(async function (instance, index) {
        if (instance.id === diagnosisInfo.id) {
          num = index + 1;
        }
      })
    );

    if (!num) {
      diagnosisNum = `LSD ${index}`;
    } else if (num < 10) {
      diagnosisNum = `LSD 000${num}`;
    } else if (num >= 10) {
      diagnosisNum = `LSD 00${num}`;
    } else if (num >= 100) {
      diagnosisNum = `LSD 0${num}`;
    } else {
      diagnosisNum = `LSD ${num}`;
    }

    diagnosisAnalysis = await parser.diagnosis3(diagnosisInfo.analysis);

    const table = new Table({
      columnWidths: [1500, 8000],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 1500,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "문서번호",
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 8000,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: diagnosisNum,
                      font: { name: "맑은 고딕" },
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 1500,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "고객명",
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 8000,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  text: diagnosisInfo.client.name,
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 1500,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "서비스일자",
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 8000,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: diagnosisInfo.paymentClients[0].createdAt,
                      font: { name: "맑은 고딕" },
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 1500,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "사건내용",
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 8000,
                type: WidthType.DXA,
              },
              children: [new Paragraph(diagnosisInfo.content)],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 1500,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "승소사례",
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 8000,
                type: WidthType.DXA,
              },
              children: [new Paragraph(diagnosisInfo.case)],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 1500,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "사건분석",
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 8000,
                type: WidthType.DXA,
              },
              children: [new Paragraph(diagnosisAnalysis[0].content)],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 1500,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "추가고려사항",
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 8000,
                type: WidthType.DXA,
              },
              children: [new Paragraph(diagnosisAnalysis[1].content)],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 1500,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "유사판례요약",
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 8000,
                type: WidthType.DXA,
              },
              children: [new Paragraph(diagnosisInfo.precedent)],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 1500,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "적용법률",
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 8000,
                type: WidthType.DXA,
              },
              children: [new Paragraph(diagnosisInfo.law)],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 1500,
                type: WidthType.DXA,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "소장초안",
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 8000,
                type: WidthType.DXA,
              },
              children: [new Paragraph(diagnosisInfo.sample)],
            }),
          ],
        }),
      ],
    });

    const doc = new Document({
      sections: [
        {
          children: [table],
        },
      ],
    });

    Packer.toBuffer(doc).then((buffer) => {
      fs.writeFileSync(
        `${diagnosisNum}_${diagnosisInfo.client.name}_분석자료.docx`,
        buffer
      );
    });

    return res.status(200).json(diagnosisInfo);
  } catch (error) {
    console.log(error);
  }
});

router.post("/", async (req, res, next) => {
  const { type, year, month } = req.body;
  let data;
  let headers;
  let title;
  try {
    if (type == "renewDiagnosis") {
      data = await renewDiagnosis(year, month);
      headers = [
        { header: "번호" },
        { header: "의뢰인" },
        { header: "대분류" },
        { header: "소분류" },
        { header: "요지서내용" },
        { header: "소장(고소장)" },
        { header: "판례요약" },
        { header: "사건분석" },
        { header: "법률" },
        { header: "승소사례" },
        { header: "사건요약" },
        { header: "작성일" },
      ];
    } else if (type == "diagnosis") {
      data = await diagnosis(year, month);
      headers = [
        { header: "번호" },
        { header: "의뢰인" },
        { header: "대분류" },
        { header: "소분류" },
        { header: "요지서내용" },
        { header: "소장(고소장)" },
        { header: "판례요약" },
        { header: "사건분석" },
        { header: "법률" },
        { header: "승소사례" },
        { header: "사건요약" },
        { header: "작성일" },
      ];
    } else if (type == "payment") {
      data = await payment(year, month);
      headers = [
        { header: "번호" },
        { header: "의뢰인명" },
        { header: "결제명" },
        { header: "결제번호" },
        { header: "merchantUid" },
        { header: "결제금액" },
        { header: "결제날짜" },
        { header: "결제방법" },
      ];
    } else if (type == "client") {
      data = await client(year, month);
      headers = [
        { header: "번호" },
        { header: "이름" },
        { header: "가입경로" },
        { header: "이메일" },
        { header: "연락처" },
        { header: "성별" },
        { header: "생년월일" },
        { header: "가입날짜" },
      ];
    }

    if (type == "diagnosis" || type == "renewDiagnosis") {
      title = "진단서비스";
    } else if (type == "payment") {
      title = "진단결제";
    } else if (type == "client") {
      title = "의뢰인가입자";
    }

    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet("내 사건 진단");

    sheet.columns = headers;

    sheet.addRows(data);

    workbook.csv
      .writeFile(
        `./files/${!year ? "" : year + "년"}${!month ? "" : month + "월"}${
          !year ? "" : "_"
        }${title}.csv`
      )
      .then((_) => {
        console.log("완료");
      })
      .catch((_) => {
        console.log("살패");
      });

    return res.status(200).json("success");
    // return res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
});

const diagnosis = async (year, month) => {
  const result = [];
  let startDate;
  let endDate;
  let whereInfo;

  if (year && month) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0);

    startDate = moment(startDate).format("YYYY-MM-DD");
    endDate = moment(endDate).format("YYYY-MM-DD");

    whereInfo = {
      payment: 1,
      createdAt: { [Op.between]: [startDate, endDate] },
    };
  } else if (year && !month) {
    let startYear = moment(year).startOf("year");
    let endYear = moment(year).endOf("year");

    startDate = startYear.format("YYYY-MM-DD");
    endDate = endYear.format("YYYY-MM-DD");

    whereInfo = {
      payment: 1,
      createdAt: { [Op.between]: [startDate, endDate] },
    };
  } else {
    whereInfo = {
      payment: 1,
    };
  }

  const summaryInfo = await models.summaries.findAll({
    where: { diagnosis: "결과보기" },
    include: [
      {
        model: models.diagnosis,
        where: whereInfo,
        required: true,
      },
      {
        model: models.clients,
      },
      {
        model: models.paymentClient,
        where: { payMethod: "card" },
        required: true,
      },
    ],
  });

  await Promise.all(
    summaryInfo.map(async function (instance, index) {
      let data = [];

      data.push(index + 1);
      data.push(instance.client.name);
      data.push(instance.mainType);
      data.push(instance.subType);
      data.push(instance.summary);
      data.push(instance.sample);
      data.push(instance.diagnoses[0].precedent);
      data.push(instance.diagnoses[0].analysis);
      data.push(instance.diagnoses[0].law);
      data.push(instance.diagnoses[0].case);
      data.push(instance.diagnoses[0].caseSummary);
      data.push(instance.diagnoses[0].createdAt);

      result.push(data);
    })
  );

  return result;
};

const renewDiagnosis = async (year, month) => {
  const result = [];
  let startDate;
  let endDate;
  let whereInfo;

  if (year && month) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0);

    startDate = moment(startDate).format("YYYY-MM-DD");
    endDate = moment(endDate).format("YYYY-MM-DD");

    whereInfo = {
      payment: 1,
      createdAt: { [Op.between]: [startDate, endDate] },
    };
  } else if (year && !month) {
    let startYear = moment(year).startOf("year");
    let endYear = moment(year).endOf("year");

    startDate = startYear.format("YYYY-MM-DD");
    endDate = endYear.format("YYYY-MM-DD");

    whereInfo = {
      payment: 1,
      createdAt: { [Op.between]: [startDate, endDate] },
    };
  } else {
    whereInfo = {
      payment: 1,
    };
  }

  const diagnosisInfo = await models.diagnosis.findAll({
    where: whereInfo,
    include: [
      {
        model: models.clients,
        attributes: ["name"],
        required: false,
      },
    ],
  });

  await Promise.all(
    diagnosisInfo.map(async function (instance, index) {
      let data = [];

      data.push(index + 1);
      if (!instance.client) {
        data.push("의뢰인");
      } else {
        data.push(instance.client.name);
      }
      data.push(instance.mainType);
      data.push(instance.subType);
      data.push(instance.content);
      data.push(instance.sample);
      data.push(instance.precedent);
      data.push(instance.analysis);
      data.push(instance.law);
      data.push(instance.case);
      data.push(instance.caseSummary);
      data.push(instance.createdAt);

      //   let data = new Object();
      //   data.id = instance.id;
      //   data.name = "김경태";
      //   data.mainType = instance.mainType;
      //   data.subType = instance.subType;
      //   data.content = instance.content;
      //   data.sample = instance.sample;
      //   data.precedent = instance.precedent;
      //   data.analysis = instance.analysis;
      //   data.law = instance.law;
      //   data.case = instance.case;
      //   data.caseSummary = instance.caseSummary;
      //   data.createdAt = instance.createdAt;

      result.push(data);
    })
  );

  return result;
};

const payment = async (year, month) => {
  const result = [];
  let startDate;
  let endDate;
  let whereInfo;

  if (year && month) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0);

    startDate = moment(startDate).format("YYYY-MM-DD");
    endDate = moment(endDate).format("YYYY-MM-DD");

    whereInfo = {
      payment: 1,
      createdAt: { [Op.between]: [startDate, endDate] },
    };
  } else if (year && !month) {
    let startYear = moment(year).startOf("year");
    let endYear = moment(year).endOf("year");

    startDate = startYear.format("YYYY-MM-DD");
    endDate = endYear.format("YYYY-MM-DD");

    whereInfo = {
      payment: 1,
      createdAt: { [Op.between]: [startDate, endDate] },
    };
  } else {
    whereInfo = {
      payMethod: "card",
      paymentName: "소송 준비 데이터 제공 수수료",
      status: "paid",
    };
  }

  const paymentInfo = await models.paymentClient.findAll({
    where: whereInfo,
    include: [
      {
        model: models.clients,
        attributes: ["name"],
      },
    ],
  });

  await Promise.all(
    paymentInfo.map(async function (instance, index) {
      let data = [];

      data.push(index + 1);
      data.push(instance.client.name);
      data.push(instance.paymentName);
      data.push(instance.impUid);
      data.push(instance.merchantUid);
      data.push(instance.amount);
      data.push(instance.createdAt);
      data.push(instance.payMethod);

      result.push(data);
    })
  );

  return result;
};

const client = async (year, month) => {
  const result = [];
  let startDate;
  let endDate;
  let where;

  if (year && month) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0);

    startDate = moment(startDate).format("YYYY-MM-DD");
    endDate = moment(endDate).format("YYYY-MM-DD");

    where = { createdAt: { [Op.between]: [startDate, endDate] } };
  } else if (year && !month) {
    let startYear = moment(year).startOf("year");
    let endYear = moment(year).endOf("year");

    startDate = startYear.format("YYYY-MM-DD");
    endDate = endYear.format("YYYY-MM-DD");

    where = { createdAt: { [Op.between]: [startDate, endDate] } };
  }

  const clientInfo = await models.clients.findAll({
    where,
  });

  await Promise.all(
    clientInfo.map(async function (instance, index) {
      let data = [];

      data.push(index + 1);
      data.push(instance.name);
      data.push(instance.signupInfo);
      data.push(instance.email);
      data.push(instance.phone);
      data.push(instance.gender);
      data.push(instance.birth);
      data.push(instance.createdAt);

      result.push(data);
    })
  );

  return result;
};

module.exports = router;

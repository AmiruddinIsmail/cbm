import express from "express";
import { config } from "dotenv";
config();

const app = express();

app.set("views", "./src/config/views");
app.set("view engine", "hbs");

app.get("/renewPlusRedirectCallbackUrl", (req, res) => {
  console.log("callback url is called");
  res.sendStatus(204);
});

app.get("/mandate", (req, res) => {
  const page = "mandate";
  const data = {
    title: "Renew Plus Mandate Status",
    status: "Authorization Failed!",
    msg: `Payment unsuccessful. Kindly ensure the bank details is correct and have sufficient balance in order to retry.`,
    url: `${process.env.renew_plus_url}/customer/create/auth/`,
    //image: images.image.failedGif,
    //logo: images.image.logo,
    image: "https://placekitten.com/300/300",
    logo: "https://placekitten.com/300/300",
    footer: `For any enquiries, kindly contact the ReNew+ team at support@compasia.com`,
    order_status: 9,
    status_respond: 0,
    button: true,
    secondAttemptUrl: "",
    referenceNumber: "",
    renewPlusRedirectCallbackUrl:
      "http://localhost:3000/renewPlusRedirectCallbackUrl",
  };

  return res.render(page, data);
});

app.get("/instantPay", (req, res) => {
  const page = "instantPay";
  const data = {
    title: "Renew Plus Instant Pay Status",
    status: "Payment Unsuccessful!",
    msg: `Thank you for your interest in applying to enrol for the Renew+ Subscription Program.
        We have reviewed your application and regret to inform you that your application is unsuccessful.
        The relevant charges that have been deducted from your account during the application process will be refunded to you within
        the next thirty (30) working days.`,
    url: `${process.env.renew_plus_url}/customer/create/auth/`,
    //image: images.image.failedGif,
    //logo: images.image.logo,
    image: "https://placekitten.com/300/300",
    logo: "https://placekitten.com/300/300",
    footer: ` We apologize for any incovenience caused. For any enquiries, kindly reach out to us at support@compasia.com`,
    order_status: 3,
    renewPlusRedirectCallbackUrl:
      "http://localhost:3000/renewPlusRedirectCallbackUrl",
  };

  return res.render(page, data);
});

await new Promise((res) => app.listen(3000, res));
console.log(":: App started at", 3000);

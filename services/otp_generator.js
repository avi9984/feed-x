import OTP from "../models/otp.model.js";
import transporter from "./nodemailer.js";

async function generateFourDigitNumber(email, req, res) {
  try {
    const otp = Math.floor(1000 + Math.random() * 9000);
    const info = await transporter.sendMail({
      from: `"Noreply mail" <lk090631@gmail.com>`, // sender address
      to: email,
      subject: "Account Creation OTP", // subject line
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Feed-X OTP Verification</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f7fb;
  font-family:Inter, Arial, Helvetica, sans-serif;
  color:#111827;
">

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    role="presentation"
    style="background:#f5f7fb; padding:48px 16px;"
  >
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          role="presentation"
          style="
            max-width:620px;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 16px 45px rgba(15, 23, 42, 0.10);
          "
        >

          <!-- Header -->
          <tr>
            <td
              style="
                padding:32px 38px;
                background:#0f172a;
              "
            >
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <div
                      style="
                        display:inline-block;
                        width:44px;
                        height:44px;
                        line-height:44px;
                        text-align:center;
                        border-radius:12px;
                        background:#ef4444;
                        color:#ffffff;
                        font-size:20px;
                        font-weight:800;
                        margin-right:12px;
                      "
                    >
                      N
                    </div>

                    <span
                      style="
                        color:#ffffff;
                        font-size:24px;
                        font-weight:800;
                        vertical-align:middle;
                        letter-spacing:-0.5px;
                      "
                    >
                      Feed-X
                    </span>
                  </td>

                  <td
                    align="right"
                    style="
                      color:#94a3b8;
                      font-size:12px;
                      font-weight:600;
                      text-transform:uppercase;
                      letter-spacing:1px;
                    "
                  >
                    Secure Verification
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent Line -->
          <tr>
            <td style="height:4px; background:#ef4444;"></td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:48px 42px 34px;">

              <div
                style="
                  display:inline-block;
                  padding:7px 12px;
                  background:#fef2f2;
                  color:#dc2626;
                  border-radius:999px;
                  font-size:12px;
                  font-weight:700;
                  letter-spacing:0.4px;
                  margin-bottom:20px;
                "
              >
                EMAIL VERIFICATION
              </div>

              <h1
                style="
                  margin:0 0 14px;
                  font-size:30px;
                  line-height:1.25;
                  color:#0f172a;
                  font-weight:800;
                  letter-spacing:-0.8px;
                "
              >
                Verify your email address
              </h1>

              <p
                style="
                  margin:0 0 10px;
                  color:#64748b;
                  font-size:16px;
                  line-height:1.7;
                "
              >
                Hello,
              </p>

              <p
                style="
                  margin:0;
                  color:#64748b;
                  font-size:16px;
                  line-height:1.7;
                "
              >
                Use the verification code below to complete your sign-in or
                registration for
                <strong style="color:#0f172a;">Feed-X</strong>.
              </p>

              <!-- OTP Box -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                role="presentation"
                style="margin:32px 0;"
              >
                <tr>
                  <td
                    align="center"
                    style="
                      background:#f8fafc;
                      border:1px solid #e2e8f0;
                      border-radius:16px;
                      padding:30px 20px;
                    "
                  >
                    <p
                      style="
                        margin:0 0 10px;
                        font-size:12px;
                        color:#94a3b8;
                        font-weight:700;
                        text-transform:uppercase;
                        letter-spacing:1.4px;
                      "
                    >
                      Your verification code
                    </p>

                    <div
                      style="
                        margin:0;
                        color:#0f172a;
                        font-size:40px;
                        line-height:1.2;
                        font-weight:800;
                        letter-spacing:10px;
                      "
                    >
                      ${otp}
                    </div>

                    <p
                      style="
                        margin:14px 0 0;
                        color:#64748b;
                        font-size:13px;
                      "
                    >
                      Valid for the next
                      <strong style="color:#334155;">10 minutes</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="
                  background:#fff7ed;
                  border:1px solid #fed7aa;
                  border-radius:12px;
                "
              >
                <tr>
                  <td style="padding:17px 18px;">
                    <p
                      style="
                        margin:0 0 5px;
                        color:#9a3412;
                        font-size:14px;
                        font-weight:700;
                      "
                    >
                      Keep your account secure
                    </p>

                    <p
                      style="
                        margin:0;
                        color:#c2410c;
                        font-size:13px;
                        line-height:1.6;
                      "
                    >
                      Never share this verification code with anyone. Feed-X
                      will never ask for your OTP through a phone call or message.
                    </p>
                  </td>
                </tr>
              </table>

              <p
                style="
                  margin:28px 0 0;
                  color:#94a3b8;
                  font-size:13px;
                  line-height:1.6;
                "
              >
                If you did not request this code, no action is required. You can
                safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 42px;">
              <div style="height:1px; background:#e2e8f0;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 42px 36px;">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p
                      style="
                        margin:0 0 6px;
                        color:#334155;
                        font-size:14px;
                        font-weight:700;
                      "
                    >
                      Feed X
                    </p>

                    <p
                      style="
                        margin:0;
                        color:#94a3b8;
                        font-size:12px;
                        line-height:1.6;
                      "
                    >
                      Latest stories. Reliable updates. One place.
                    </p>
                  </td>
                </tr>
              </table>

              <p
                style="
                  margin:24px 0 0;
                  color:#cbd5e1;
                  font-size:11px;
                  line-height:1.6;
                "
              >
                © 2026 Feed-X. All rights reserved.<br />
                This is an automated security email. Please do not reply.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`

    });
    const expiry_date = Date.now() + 1000 * 60 * 15


    await OTP.create({
      email: email.toLowerCase(),
      otp: otp,
      expire_otp: expiry_date
    });


    return res.status(200).json({ message: "otp sent successfully", success: true })

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", success: false })
  }
}

export default generateFourDigitNumber;
const sendEmail = async (email: string, subject: string, html: string) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not set in environment variables");
  }
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { email: "nguyennhungforwork04@gmail.com", name: "Nhung Nguyen" }, // Change to a verified email
      to: [{ email }],
      subject,
      htmlContent: html,
    }),
  });

  console.log("Email response status:", response);
  return response;
};

export const sendVerificationEmail = async (email: string, token: string) => {
  if (!process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not set in environment variables");
  } 
  const confirmLink = `${process.env.FRONTEND_URL}/auth/new-verification?token=${token}`;
  console.log("Confirm link:", confirmLink);
  const html = `<p>Click <a href="${confirmLink}">here</a> to confirm your email.</p>`;
  const res = await sendEmail(email, "Confirm your email", html);
  return res;
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.FRONTEND_URL}/auth/new-password?token=${token}`;
  console.log("Reset link:", resetLink);
  const html = `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`;
  const res = await sendEmail(email, "Reset your password", html);
  return res;
};

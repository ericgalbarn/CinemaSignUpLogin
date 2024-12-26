import React, { useState } from "react";
import axios from "axios";
import "./PasswordReset.css";

const PasswordReset = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify and reset
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResetRequest = async () => {
    setError("");
    setSuccess("");

    try {
      await axios.post(
        "http://localhost:8080/api/v1/auth/reset-password/request",
        {
          email,
          type: 1, // Assuming user type 1
        }
      );
      setSuccess("OTP đã được gửi đến email của bạn!");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleResetFinish = async () => {
    setError("");
    setSuccess("");

    try {
      await axios.post(
        "http://localhost:8080/api/v1/auth/reset-password/finish",
        {
          resetKey: otp,
          type: 1, // Assuming user type 1
          newPassword,
        }
      );
      setSuccess("Mật khẩu đã được cập nhật thành công!");
      setTimeout(onBackToLogin, 2000); // Redirect back to login after 2 seconds
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">Đặt lại mật khẩu</div>
        <div className="underline"></div>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      {step === 1 ? (
        <>
          <div className="inputs">
            <div className="input">
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="submit-container">
            <div className="submit" onClick={handleResetRequest}>
              Gửi yêu cầu
            </div>
            <div className="submit gray" onClick={onBackToLogin}>
              Quay lại Đăng nhập
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="inputs">
            <div className="input">
              <input
                type="text"
                placeholder="Nhập mã OTP..."
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div className="input">
              <input
                type="password"
                placeholder="Nhập mật khẩu mới..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="submit-container">
            <div className="submit" onClick={handleResetFinish}>
              Cập nhật mật khẩu
            </div>
            <div className="submit gray" onClick={() => setStep(1)}>
              Quay lại bước trước
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PasswordReset;

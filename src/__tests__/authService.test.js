import authService from "../services/authService";
import apiClient from "../services/apiClient";

jest.mock("../services/apiClient", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe("authService", () => {
  afterEach(() => jest.clearAllMocks());

  it("registers a user", async () => {
    const payload = {
      full_name: "Test",
      email_id: "test@test.com",
      mobile_number: "1234567890",
      password: "pass",
    };
    apiClient.post.mockResolvedValue({ data: { Status: "1" } });
    await authService.register(payload);
    expect(apiClient.post).toHaveBeenCalledWith("/Auth/Register", payload);
  });

  it("logs in with password", async () => {
    const payload = { email_id: "a@b.com", password: "pass" };
    apiClient.post.mockResolvedValue({ data: { token: "t" } });
    await authService.passwordLogin(payload);
    expect(apiClient.post).toHaveBeenCalledWith("/Auth/Password-Login", payload);
  });

  it("requests OTP login", async () => {
    const payload = { email_id: "a@b.com" };
    apiClient.post.mockResolvedValue({ data: { Status: true } });
    await authService.otpLogin(payload);
    expect(apiClient.post).toHaveBeenCalledWith("/Auth/OTP-Login", payload);
  });

  it("verifies OTP", async () => {
    const payload = { email_id: "a@b.com", otp: "1234" };
    apiClient.post.mockResolvedValue({ data: { token: "t" } });
    await authService.verifyLoginOtp(payload);
    expect(apiClient.post).toHaveBeenCalledWith("/Auth/Verify-Login-OTP", payload);
  });

  it("requests forgot password", async () => {
    const payload = { email_id: "a@b.com" };
    apiClient.post.mockResolvedValue({ data: { Status: "1" } });
    await authService.forgotPassword(payload);
    expect(apiClient.post).toHaveBeenCalledWith("/Auth/Forgot-Password", payload);
  });
});

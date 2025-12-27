let mockGet = jest.fn();
let mockPost = jest.fn();

const axios = {
  create: jest.fn(() => ({
    get: mockGet,
    post: mockPost,
  })),
  mockGet,
  mockPost,
};

module.exports = axios;

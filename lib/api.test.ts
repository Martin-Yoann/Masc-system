import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBAdminDetailPath,
  buildBAdminsListPath,
  buildBUserDetailPath,
  buildBUsersListPath,
} from "./api";

test("buildBUsersListPath: defaults to page=1,page_size=15 and omits empty keyword", () => {
  const path = buildBUsersListPath({});
  assert.equal(path, "/api/b/users?page=1&page_size=15");
});

test("buildBUsersListPath: includes keyword/page/page_size when provided", () => {
  const path = buildBUsersListPath({
    keyword: "zhangsan",
    page: 2,
    page_size: 50,
  });
  assert.equal(path, "/api/b/users?keyword=zhangsan&page=2&page_size=50");
});

test("buildBUsersListPath: trims keyword and encodes it", () => {
  const path = buildBUsersListPath({ keyword: "  张三丰  " });
  assert.equal(
    path,
    `/api/b/users?keyword=${encodeURIComponent("张三丰")}&page=1&page_size=15`,
  );
});

test("buildBUserDetailPath: builds a valid user detail path", () => {
  assert.equal(buildBUserDetailPath(1), "/api/b/users/1");
});

test("buildBAdminsListPath: defaults to page=1,page_size=15 and omits empty keyword", () => {
  const path = buildBAdminsListPath({});
  assert.equal(path, "/api/b/admins?page=1&page_size=15");
});

test("buildBAdminsListPath: includes keyword/page/page_size when provided", () => {
  const path = buildBAdminsListPath({
    keyword: "admin",
    page: 3,
    page_size: 15,
  });
  assert.equal(path, "/api/b/admins?keyword=admin&page=3&page_size=15");
});

test("buildBAdminDetailPath: builds a valid admin detail path", () => {
  assert.equal(buildBAdminDetailPath(1), "/api/b/admins/1");
});

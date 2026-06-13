import { describe, it, expect } from 'vitest'
import { signInSchema, changePasswordSchema } from './auth'
import { createProjectSchema } from './project'
import { addMemberSchema } from './member'

describe('signInSchema', () => {
  it('chấp nhận input hợp lệ', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: '123456' }).success).toBe(true)
  })
  it('từ chối email sai', () => {
    expect(signInSchema.safeParse({ email: 'x', password: '123456' }).success).toBe(false)
  })
  it('từ chối password ngắn (<6)', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: '123' }).success).toBe(false)
  })
})

describe('changePasswordSchema', () => {
  it('chấp nhận khi 2 mật khẩu khớp + đủ dài', () => {
    expect(
      changePasswordSchema.safeParse({ password: 'abc123', confirm: 'abc123' }).success,
    ).toBe(true)
  })
  it('từ chối khi không khớp', () => {
    expect(
      changePasswordSchema.safeParse({ password: 'abc123', confirm: 'xyz123' }).success,
    ).toBe(false)
  })
  it('từ chối khi quá ngắn', () => {
    expect(changePasswordSchema.safeParse({ password: '123', confirm: '123' }).success).toBe(false)
  })
})

describe('createProjectSchema', () => {
  it('key in hoa 2-10 ký tự', () => {
    expect(createProjectSchema.safeParse({ name: 'Web', key: 'WEB' }).success).toBe(true)
    expect(createProjectSchema.safeParse({ name: 'Web', key: 'WEBAPP1234' }).success).toBe(true)
  })
  it('từ chối key thường / quá ngắn / quá dài / ký tự lạ', () => {
    expect(createProjectSchema.safeParse({ name: 'Web', key: 'web' }).success).toBe(false)
    expect(createProjectSchema.safeParse({ name: 'Web', key: 'W' }).success).toBe(false)
    expect(createProjectSchema.safeParse({ name: 'Web', key: 'WEBAPP12345' }).success).toBe(false)
    expect(createProjectSchema.safeParse({ name: 'Web', key: 'WE-B' }).success).toBe(false)
  })
  it('cần name', () => {
    expect(createProjectSchema.safeParse({ name: '', key: 'WEB' }).success).toBe(false)
  })
})

describe('addMemberSchema', () => {
  it('email + role hợp lệ', () => {
    expect(addMemberSchema.safeParse({ email: 'a@b.com', role: 'member' }).success).toBe(true)
    expect(addMemberSchema.safeParse({ email: 'a@b.com', role: 'admin' }).success).toBe(true)
  })
  it('từ chối email sai / role lạ', () => {
    expect(addMemberSchema.safeParse({ email: 'x', role: 'member' }).success).toBe(false)
    expect(addMemberSchema.safeParse({ email: 'a@b.com', role: 'owner' }).success).toBe(false)
  })
})

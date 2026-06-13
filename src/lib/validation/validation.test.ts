import { describe, it, expect } from 'vitest'
import { signInSchema, signUpSchema } from './auth'
import { createProjectSchema } from './project'
import { inviteSchema } from './invite'

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

describe('signUpSchema', () => {
  it('cần fullName', () => {
    expect(
      signUpSchema.safeParse({ email: 'a@b.com', password: '123456', fullName: '' }).success,
    ).toBe(false)
    expect(
      signUpSchema.safeParse({ email: 'a@b.com', password: '123456', fullName: 'An' }).success,
    ).toBe(true)
  })
  it('token là optional', () => {
    const r = signUpSchema.safeParse({ email: 'a@b.com', password: '123456', fullName: 'An' })
    expect(r.success).toBe(true)
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

describe('inviteSchema', () => {
  it('email + role hợp lệ', () => {
    expect(inviteSchema.safeParse({ email: 'a@b.com', role: 'member' }).success).toBe(true)
    expect(inviteSchema.safeParse({ email: 'a@b.com', role: 'admin' }).success).toBe(true)
  })
  it('từ chối email sai / role lạ', () => {
    expect(inviteSchema.safeParse({ email: 'x', role: 'member' }).success).toBe(false)
    expect(inviteSchema.safeParse({ email: 'a@b.com', role: 'owner' }).success).toBe(false)
  })
})

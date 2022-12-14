"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.sanitizeUsername = exports.sanitizePassword = exports.commentSchema = exports.emailSchema = exports.newPasswordSchema = exports.newUsernameSchema = void 0;
const express_validator_1 = require("express-validator");
const newUsernameSchema = (0, express_validator_1.body)('username').trim()
    .isLength({ min: 5 }).withMessage('Username must be at least 5 characters long')
    .isLength({ max: 20 }).withMessage('Username must be at most 20 characters long')
    .isAlphanumeric().withMessage('Username must only contain letters and numbers');
exports.newUsernameSchema = newUsernameSchema;
const newPasswordSchema = (0, express_validator_1.body)('password').trim()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/).withMessage('Password must contain at least one letter, one number, and one special character');
exports.newPasswordSchema = newPasswordSchema;
const emailSchema = (0, express_validator_1.body)('email').trim().normalizeEmail()
    .isEmail().withMessage('Email must be a valid email address');
exports.emailSchema = emailSchema;
const commentSchema = (0, express_validator_1.body)('comment').trim().escape()
    .isLength({ min: 1 }).withMessage('Comment must not be empty')
    .isLength({ max: 1000 }).withMessage('Comment must be at most 1000 characters long');
exports.commentSchema = commentSchema;
const sanitizePassword = (0, express_validator_1.body)('password').trim();
exports.sanitizePassword = sanitizePassword;
const sanitizeUsername = (0, express_validator_1.body)('username').trim();
exports.sanitizeUsername = sanitizeUsername;
const validate = (validations) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        yield Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        res.status(400).render('register.html', { errors: errors.array(), username: req.body.username, email: req.body.email });
    });
};
exports.validate = validate;

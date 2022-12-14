import { body, validationResult, ValidationChain} from 'express-validator';
import express from 'express';

const newUsernameSchema: ValidationChain = body('username').trim()
    .isLength({ min: 5 }).withMessage('Username must be at least 5 characters long')
    .isLength({ max: 20 }).withMessage('Username must be at most 20 characters long')
    .isAlphanumeric().withMessage('Username must only contain letters and numbers');
        
const newPasswordSchema: ValidationChain = body('password').trim()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/).withMessage('Password must contain at least one letter, one number, and one special character');

const emailSchema: ValidationChain = body('email').trim().normalizeEmail()
    .isEmail().withMessage('Email must be a valid email address');

const commentSchema: ValidationChain = body('comment').trim().escape()
    .isLength({ min: 1 }).withMessage('Comment must not be empty')
    .isLength({ max: 1000 }).withMessage('Comment must be at most 1000 characters long');

const sanitizePassword: ValidationChain = body('password').trim();
const sanitizeUsername: ValidationChain = body('username').trim();


const validate = (validations: ValidationChain[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).render('register.html',{ errors: errors.array(), username: req.body.username, email: req.body.email });
  };
};

export {
    newUsernameSchema,
    newPasswordSchema,
    emailSchema,
    commentSchema,
    sanitizePassword,
    sanitizeUsername,
    validate
};

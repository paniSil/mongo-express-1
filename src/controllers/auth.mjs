import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser, comparePasswords, users } from '../data/usersBackup.mjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import passport from 'passport';

const JWT_SECRET = 'secret';
const JWT_EXPIRES_IN = '1h';

export async function register(req, res) {
    const { name, email, password, age } = req.body;
    const theme = req.cookies.theme || 'light';
    await createUser(name, email, password, age, theme);
    res.redirect('/auth/login');
}

export const login = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true
});

export function logout(req, res) {
    req.logout(() => {
        res.redirect('/');
    });
}

export const getLoginPage = (req, res) => {
    const theme = req.cookies.theme || 'light';
    res.render('auth/login.pug', { title: 'Вхід', theme: theme });
};

export const getRegisterPage = (req, res) => {
    const theme = req.cookies.theme || 'light';
    res.render('auth/register.pug', { title: 'Реєстрація', theme: theme });
};

export function getForgotPage(req, res) {
    const theme = req.cookies.theme || 'light';
    res.render('auth/forgot.pug', { theme });
}

export async function postForgot(req, res) {
    const { email } = req.body;
    const user = findUserByEmail(email);
    const theme = req.cookies.theme || 'light';
    if (!user) {
        return res.render('auth/forgot.pug', { message: 'Email not found', theme });
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 година

    // Створення тестового акаунта Ethereal 
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
    const info = await transporter.sendMail({
        to: user.email,
        subject: 'Password Reset',
        html: `<a href="http://localhost:3000/auth/reset/${token}">Reset password</a>`
    });

    res.render('auth/forgot.pug', { message: 'Check your email for reset link (Ethereal)', theme });
    console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
}

export function getResetPage(req, res) {
    const user = users.find(u => u.resetToken === req.params.token && u.resetTokenExpiry > Date.now());
    const theme = req.cookies.theme || 'light';
    if (!user) return res.send('Token invalid or expired');
    res.render('auth/reset.pug', { token: req.params.token, theme });
}

export async function postReset(req, res) {
    const user = users.find(u => u.resetToken === req.params.token && u.resetTokenExpiry > Date.now());
    if (!user) return res.send('Token invalid or expired');
    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    res.redirect('/auth/login');
}
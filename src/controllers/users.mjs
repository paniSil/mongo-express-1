//import { users } from "../data/users.mjs";
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const getUsersHandler = async (req, res) => {
    try {
        const db = req.app.locals.db
        if (!db) {
            return res.status(500).json({ message: 'Error: DB is not connected' });
        }
        const usersCollection = db.collection('users');
        const users = await usersCollection.find({}).toArray();

        const theme = req.cookies.theme || 'light';
        res.render('users.pug', { users: users, theme: theme, user: req.user });
    } catch (error) {
        console.error('Error: get user list', error);
        res.status(500).json({ message: 'Server error' });
    }

}

const postUsersHandler = async (req, res) => {
    try {
        const db = req.app.locals.db
        if (!db) {
            return res.status(500).json({ message: 'Error: DB is not connected' });
        }

        const { name, email, password, age } = req.body;

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            age,
            role: 'admin',
            resetToken: null,
            resetTokenExpiry: null
        };

        const usersCollection = db.collection('users');
        const result = await usersCollection.insertOne(newUser);

        //const theme = req.cookies.theme || 'light';
        //res.render('users.pug', { users: users, theme: theme, user: req.user });
        res.status(201).json({ message: 'User created!', userId: result.insertedId, user: { _id: result.insertedId, name, email, age, role: 'admin' } });
    } catch (error) {
        console.error('Error: post user error', error);
        res.status(500).json({ message: 'Server error' });
    }
    // const { name, email, age } = req.body;
    // const newUser = { id: (users.length + 1).toString(), name, email, age };

    // if (newUser && newUser.name) {
    //     users.push(newUser)
    //     res.status(201).send('Post users route')
    // } else {
    //     res.status(400).send('Bad Request')
    // }
}

const getUserByIdHandler = async (req, res) => {
    try {
        const db = req.app.locals.db
        if (!db) {
            return res.status(500).json({ message: 'Error: DB is not connected' });
        }
        const userId = req.params.id;
        const usersCollection = db.collection('users');

        const userProfile = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (userProfile) {
            console.log('User found:', userProfile);
            res.render('user-profile.pug', { userProfile: userProfile, theme: theme, user: req.user });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error: get user by ID error', error);
        res.status(500).json({ message: 'Server error' });
    }

    // const userId = req.params.id;
    // const userProfile = users.find(u => u.id === userId);
    // const theme = req.cookies.theme || 'light';
    // if (userProfile) {

    //     console.log('User found:', userProfile)
    //     res.render('user-profile.pug', { userProfile: userProfile, theme: theme, user: req.user })
    // } else {
    //     res.status(404).send('Not Found')
    // }
}

const putUserByIdHandler = async (req, res) => {
    try {
        const db = req.app.locals.db
        if (!db) {
            return res.status(500).json({ message: 'Error: DB is not connected' });
        }

        const userId = req.params.id;
        const { name, email, age } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (age) updates.age = age;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No update data' });
        }

        const usersCollection = db.collection('users');
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
        res.status(200).json({ message: `User ${userId} is updated`, user: updatedUser });
    } catch (error) {
        console.error('Error: put user by ID error', error);
        res.status(500).json({ message: 'Server error' });
    }

    // const userId = req.params.id;
    // const { name, email, age } = req.body;

    // const userIndex = users.findIndex(u => u.id === userId);

    // if (userIndex !== -1) {
    //     if (!name && !email && !age) {
    //         return res.status(400).json({ message: 'No data provided for update.' });
    //     }
    //     users[userIndex] = {
    //         ...users[userIndex],
    //         ...(name && { name }),
    //         ...(email && { email }),
    //         ...(age && { age })
    //     };
    //     res.status(200).json({ message: `User ${userId} updated successfully!`, user: users[userIndex] });

    // } else {
    //     res.status(404).json({ message: 'User Not Found' });
    // }
}

const deleteUserByIdHandler = async (req, res) => {

    try {
        const db = req.app.locals.db
        if (!db) {
            return res.status(500).json({ message: 'Error: DB is not connected' });
        }
        const userId = req.params.id;
        const usersCollection = db.collection('users');

        const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error: delete user by ID error', error);
        res.status(500).json({ message: 'Server error' });
    }
    // const userId = req.params.id;
    // const userIndex = users.findIndex(u => u.id === userId);

    // if (userIndex !== -1) {
    //     users.splice(userIndex, 1);
    //     res.status(204).send();
    // } else {
    //     res.status(404).json({ message: 'User Not Found' });
    // }
};

const findUserByEmail = async (db, email) => {
    const usersCollection = db.collection('users');
    return await usersCollection.findOne({ email });
};

const findUserById = async (db, id) => {
    const usersCollection = db.collection('users');
    if (!ObjectId.isValid(id)) {
        return null;
    }
    return await usersCollection.findOne({ _id: new ObjectId(id) });
};

const createUserInDb = async (db, name, email, password, age) => {
    const usersCollection = db.collection('users');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
        name,
        email,
        password: hashedPassword,
        age: parseInt(age, 10), // Переконайтеся, що вік - це число
        role: 'admin', // Згідно з README, нові користувачі отримують роль 'admin'
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(), // Додаємо мітку часу створення
        updatedAt: new Date()  // Додаємо мітку часу оновлення
    };

    const result = await usersCollection.insertOne(newUser);
    return { _id: result.insertedId, ...newUser }; // Повертаємо об'єкт користувача з _id
};

const updateUserInDb = async (db, user) => {
    const usersCollection = db.collection('users');
    const { _id, ...updates } = user; // Виключаємо _id з оновлень, воно не змінюється
    await usersCollection.updateOne(
        { _id: new ObjectId(_id) }, // Шукаємо за _id
        { $set: { ...updates, updatedAt: new Date() } } // Оновлюємо поля та мітку часу
    );
};

export { getUsersHandler, postUsersHandler, getUserByIdHandler, putUserByIdHandler, deleteUserByIdHandler, findUserByEmail, findUserById, createUserInDb, updateUserInDb }

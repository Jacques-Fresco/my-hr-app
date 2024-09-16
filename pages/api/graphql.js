import { ApolloServer, gql } from 'apollo-server-micro';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const ACCESS_TOKEN_SECRET = 'your_access_token_secret';
const REFRESH_TOKEN_SECRET = 'your_refresh_token_secret';
const saltRounds = 10;

// Функция для создания пользователей
async function createUsers() {
    const password = 'Qqwerty1234!';
    const hash = await bcrypt.hash(password, saltRounds);

    const users = [
        {
            id: "1",
            email: "m@example.com",
            password: hash,
            name: "John Doe",
            avatar: null
        }
    ];

    return users;
}

// Определение схемы GraphQL
const typeDefs = gql`
    type Query {
        me: User
    }

    type Mutation {
        login(email: String!, password: String!): AuthPayload
    }

    type AuthPayload {
        accessToken: String
        refreshToken: String
    }

    type User {
        id: ID!
        email: String!
        name: String
        avatar: String
    }
`;

// Определение резолверов
const resolvers = {
    Query: {
        me: (_, __, { user }) => {
            if (!user) {
                throw new Error('Неаутентифицированный пользователь');
            }
            return user;
        }
    },
    Mutation: {
        login: async (_, { email, password }, { users }) => {
            const user = users.find((user) => user.email === email);
            if (!user) {
                throw new Error('Неверные учетные данные');
            }

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                throw new Error('Неверные учетные данные');
            }

            const accessToken = jwt.sign({ userId: user.id }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
            const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
            return { accessToken, refreshToken };
        }
    }
};

// Создание сервера Apollo
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
        const token = req.headers.authorization || '';
        let user = null;

        const users = await createUsers(); // Вызываем функцию для получения пользователей

        if (token) {
            try {
                const decoded = jwt.verify(token.replace('Bearer ', ''), ACCESS_TOKEN_SECRET);
                user = users.find(user => user.id === decoded.userId);
            } catch (error) {
                console.error('Ошибка верификации токена:', error);
            }
        }
        return { user, users };
    }
});

// Экспортируем API-обработчик
export const config = {
    api: {
        bodyParser: false,
    },
};

// Оборачиваем вызов в асинхронную функцию
const startServer = async () => {
    await server.start();
    return server.createHandler({ path: '/api/graphql' });
};

export default async function handler(req, res) {
    const handler = await startServer();
    return handler(req, res);
}

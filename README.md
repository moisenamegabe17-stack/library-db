# Library catalogue (Express + MongoDB)

## Run
1. Start MongoDB locally (or set `MONGODB_URI` to an Atlas connection string).
2. `npm install`
3. `npm start`
4. Open http://localhost:3000

## API
| Method | Route | Operation |
|---|---|---|
| POST | /api/books | Create |
| GET | /api/books?q=&status= | Read (list/search) |
| GET | /api/books/:id | Read one |
| PUT | /api/books/:id | Update |
| DELETE | /api/books/:id | Delete |

import User from "../models/user"
//Fake DB
// const users = [
//     {
//         id:"1",
//         name: "Jaran"
//     },
//     {
//         id:"2",
//         name: "Jatpeya"
//     },
//     {
//         id:"3",
//         name: "kob"
//     },
// ]

// const me = users[0]
// console.log(me)
const Query ={
    // me: (parent, args, context, info) => me,
    user: (parent, args, context, info) => User.findById(args.id),
    users: (parent, args, context, info) => User.find({})
    
}


const Mutation = {
    singup:  (parent, args, context, info) => {
        return User.create(args)
    }
}

 const resolvers = {
    Query,
    Mutation
}
export default resolvers
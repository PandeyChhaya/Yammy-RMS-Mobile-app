import prisma from '../../db.js';


export const postTable = async(body:any)=>{

    const{table_number, floor, capacity}= body;

    const checkTableExists = await prisma.tables.findUnique({
        where:{table_number},
    });

    if(checkTableExists) throw new Error ("Table already exists!!");

    const createTable = await prisma.tables.create({
        data:{
            table_number,
            floor,
            capacity
        }
    });
    return {message:"Table created successfully!!", table_id:createTable.table_id}
};

export const getAllTable = async()=>{
    const tables = await prisma.tables.findMany();
    return tables;
};
export const getTable= async(body:any)=>{
    const {table_id}= body;

    const checkTableExists= await prisma.tables.findUnique({
        where:{table_id},
    })
    if(!checkTableExists) throw new Error ("Table doesnt exist!!");

    return checkTableExists;
};
export const putTable= async(body:any)=>{
    const{table_id, floor, capacity, table_number}= body;

    const checkTableExists = await prisma.tables.findUnique({
        where:{table_id},
    })
    if(!checkTableExists) throw new Error ("Table doesnt exist!!");

    const updatedTable= await prisma.tables.update({
        where:{
            table_id,
        },
        data:{
            table_number,
            floor,
            capacity    
        }
    });
    return {message:("Table Updated Successfully!!"), table_id: updatedTable.table_id};

}
export const deleteTable = async(body:any)=>{
    const {table_id}= body;

    const checkTableExists = await prisma.tables.findUnique({
        where:{table_id},
    });
    if(!checkTableExists) throw new Error ("Table doesnt exist!!");

     await prisma.tables.delete ({
        where:{table_id}
    })

    return{message:("Table deleted successfully!!"), table_id};
}
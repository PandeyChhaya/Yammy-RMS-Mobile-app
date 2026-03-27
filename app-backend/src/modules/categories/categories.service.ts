import prisma from '../../db.js';

export const postCategory = async(body:any)=>{

    const {category_name, category_description , slug}= body;

    const categoryExists= await prisma.categories.findUnique({
        where: {slug},
    });
    
    if(categoryExists) throw new Error('Category already exists');

    const postNewCategory = await prisma.categories.create({
        data:{
            category_name,
            category_description,
            slug
        }
    });
    return {message:"New Category created!!" , category_id:postNewCategory.category_id}
};

export const getCategory= async(body:any)=>{

    const {category_id}= body;

    const categoryExists = await prisma.categories.findUnique(
        {
            where:{category_id},
        }
    );
    if(!categoryExists) throw new Error ("Categories does'nt exist!!");
     return categoryExists;
};

export const getAllCategory= async()=>{

    const categories = await prisma.categories.findMany();
    return categories;
} 

const putCategory=async(body:any)=>{

    const {category_id, category_name,category_description, slug}= body;

    const categoryExists= await prisma.categories.findUnique({
        where: {category_id},
    });
    if (!categoryExists) throw new Error ("Category does'nt exist!!");

    const updatedCategory = await prisma.categories.update({
        where:{
            category_id,
        },
        data:{
            category_name,
            category_description,
            slug,
        }})
        return{message: "Category updated successfully!!" , category_id: updatedCategory.category_id};
    };

    

    export const deleteCategory= async(body:any)=>{

        const{category_id}= body;

        const categoryExists= await prisma.categories.findUnique({
            where:{category_id},
        });

        if(!categoryExists) throw new Error("Category does'nt exist!!");

        
        
        await prisma.categories.delete({
            where:{category_id},
        });

        return {message:"Category deleted successfully!", category_id};
      
    }
import { Router } from "express";

const router = Router();

router.post("/register",(req,res)=>
            {
                res.json({
                    "message":"registered"
                })
            }
);

router.post("/login", (req,res)=>{
    res.json({
        "message": "logged in"
    })
});

router.post("/logout", (req,res)=>{
    res.json({
        "message":"logged out"
    })
})

router.post("/refresh-token", (req,res)=>{
    res.json({
        "message":"Refreshed"
    })
})

export default router;
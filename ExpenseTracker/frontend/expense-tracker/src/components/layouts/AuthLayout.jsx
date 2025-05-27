import React from "react"; 

import CARD_2 from "../../assets/images/card-2.png";
import { LutrendingUpDown } from "../../assets/icons/lu";


const AuthLayout = ({children})=> {
  return (
    <div>
        <div className="w-screen h-screen md:w-[60vw] px-12 pt-8 pb-12">
            <h2 className="text-lg font-medium text-black"> Expense Tracker </h2>
            {children}
        </div> 
        <div className="hidden md:block w-[40vw] h-screen bg-violet-50 bg-auth-bg-img bg-cover bg-no-repeat bg-center overflow-hidden p-8 relative">
            <div className="w-48 h-48 rounded-[40px] bg-purple-600 absolute -top-7 -left-5"/>
            <div className="w-48 h-56 rounded-[40px] border-[20px] border-fuchsia-600 absolute top-[30%] -right-10"/>
            <div className="w-48 h-48 rounded-[40px] bg-violet-500 absolute -bottom-7 -left-5"/>


            <div className ="grid grid-cols-1 z-20">
              < StatsInfoCard
              icon={<LutrendingUpDown />}
              label="Track your expenses"
              value=""
              color="text-purple-600"
              />
              </div>


            <img
                src={CARD_2}
                alt="card"
                className="w-[90%] h-[90%] absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 object-cover"
            ></img>

        </div>

    </div>
  );
}

export default AuthLayout;

const StatsInfoCard = ({icon, label, value, color}) => {
  return <div className ="">
    <div className={`w-12 h-12 flex items-center justify-center text-[26px] font-medium ${color}`}
    >
      {icon}
      </div>
    <div>
    <h6 className="text-xs text-gray-500 mb-1 ">{label}</h6>
    <span className="text-[20px]">${value}</span>
    </div>
  </div>;
}

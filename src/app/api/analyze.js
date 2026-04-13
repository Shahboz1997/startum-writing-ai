import { motion } from "framer-motion";

const ScoreDisplay = ({ analysis }) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        {Object.entries(analysis.criteria).map(([name, score]) => (
          <div key={name} className="text-center">
            <div className="text-[10px] font-black uppercase text-slate-500 mb-2">{name.replace('_', ' ')}</div>
            <div className="text-2xl font-black text-red-600">{score}</div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: `${(score / 9) * 100}%` }} 
                 className="h-full bg-red-600" 
               />
            </div>
          </div>
        ))}
        <div className="col-span-full mt-6 p-4 bg-white dark:bg-slate-800 rounded-2xl text-sm italic text-slate-600 dark:text-slate-300">
          {`Overall Band Score: ${analysis.band_score} - ${analysis.feedback}`}
        </div>
      </div>
    );
  };
  
import { Link } from "react-router-dom";

interface Props {
    rightText: string;
    rightLink: string;
    rightLabel: string;
}

const AuthHeader = ({ rightText, rightLink, rightLabel }: Props) => {
    return (
        <div className="sm:flex-col md:flex justify-between items-center mb-10">
            <div className="flex items-center gap-2 font-bold text-lg justify-center">
                <img
                    src="/favicon.svg"
                    alt="logo"
                    className="w-12.5 h-12.5 mr-2"
                />
                <span className="text-[20px] font-bold">EDUMIND</span>
            </div>

            <div className="text-sm text-[#4E5566] text-center mt-2">
                {rightText}{" "}
                <Link to={rightLink} className="text-orange-500 font-medium">
                    {rightLabel}
                </Link>
            </div>
        </div>
    );
};

export default AuthHeader;

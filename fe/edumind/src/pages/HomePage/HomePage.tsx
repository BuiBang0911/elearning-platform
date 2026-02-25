import Category from "../../components/Category/Category";
import CourseList from "../../components/Course/CourseList";
import Footer from "../../components/Footer/Footer";
import Header from "../../components/Header/Header";
import HeroSlider from "../../components/HeroSlider/HeroSlider";
import InstructorList from "../../components/Instructor/InstructorList";
import Newsletter from "../../components/Newsletter/Newsletter";

import { courses, instructors } from "../../constants/index";

export default function HomePage() {
    return (
        <>
            <div className="container mx-auto">
                {/* Header */}
                <Header />
                {/* HeroSlider */}
                <HeroSlider />
                {/* Category */}
                <Category />
                {/* Course By Instructor */}
                <CourseList
                    title={"More from Kitani Studio"}
                    subTitle={
                        "We know the best things for You.  Top picks for You."
                    }
                    courses={courses}
                />
                {/* Trending Course */}
                <CourseList
                    title={"Trending Course"}
                    subTitle={
                        "We know the best things for You.  Top picks for You."
                    }
                    courses={courses}
                />
                {/* Instructor */}
                <InstructorList
                    title={"Popular Instructor"}
                    subTitle={
                        "We know the best things for You.  Top picks for You."
                    }
                    instructors={instructors}
                />
                {/* Newsletter */}
                <Newsletter />
            </div>
            {/* Footer */}
            <Footer />
        </>
    );
}

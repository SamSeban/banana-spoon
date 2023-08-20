function parseTranscript(text) {
    const lines = text.split('\n');
    const seenCourses = new Set();

    function findLineContains(label) {
        return lines.find(line => line.includes(label));
    }

    function extractCourses(startIndex, endIndex, seenCourses) {
        return lines.slice(startIndex, endIndex).map(line => {
            const parts = line.split('\t');
            const courseNumber = parts[0].trim();
            const grade = parts[3].trim();
            if (seenCourses.has(courseNumber) || grade === 'לא השלים' || grade.includes('*')) {
                return null;
            }
            if (!isNaN(grade) && parseInt(grade, 10) < 55) {
                return null;
            }
            seenCourses.add(courseNumber);
            return {
                "course-number": courseNumber,
                "course-name": parts[1].trim(),
                "credits": parts[2].trim(),
                "grade": grade
            };
        }).filter(course => course !== null);
    }
    

    const studentNameLine = findLineContains("שם מלא:");
    const studentName = studentNameLine.split('\t')[1];

    const idLine = findLineContains("ת.ז.");
    const id = idLine.split('\t')[3];

    const facultyLine = findLineContains("פקולטה:");
    const faculty = facultyLine.split('\t')[1];

    const diplomaLine = findLineContains("לתואר:");
    const diploma = diplomaLine.split('\t')[3];

    const gpaLine = findLineContains("ממוצע מצטבר:");
    const gpa = gpaLine.split('\t')[1];

    const successRateLine = findLineContains("שיעור הצלחות מצטבר:");
    const successRate = successRateLine.split('\t')[3];

    const creditsLine = findLineContains("נקודות מצטברות:");
    const credits = creditsLine.split('\t')[5];

    const exemptionsStartIndex = lines.indexOf("זיכויים") + 2;
    const exemptionsEndIndex = (lines.findIndex(function(item){
        return item.indexOf("סה\"כ נקודות זיכוי:")!==-1;
    }));
    const exemptions = extractCourses(exemptionsStartIndex, exemptionsEndIndex, seenCourses);

    const semesters = [];
    let currentIndex = 0;
    let newIndex = 0;
    while (newIndex !== -1) {
        newIndex = lines.slice(currentIndex).findIndex(line => line.match(/^סמסטר\s+(קיץ|חורף|אביב)/))
        if (newIndex !== -1) {
            currentIndex = newIndex + currentIndex
            const semesterName = lines[currentIndex].trim();
            const coursesStartIndex = currentIndex + 2;
            const coursesEndIndex = (lines.slice(coursesStartIndex).findIndex(function(item){
                return item.indexOf("נקודות")!==-1;
            })) + coursesStartIndex;
            const courses = extractCourses(coursesStartIndex, coursesEndIndex, seenCourses);
            
            semesters.push({
                "semester-name": semesterName,
                "courses": courses
            });

            currentIndex = coursesEndIndex;
        }
    }

    const result = {
        "student-name": studentName,
        "id": id,
        "faculty": faculty,
        "diploma": diploma,
        "gpa": gpa,
        "success-rate": successRate,
        "credits": credits,
        "exemptions": exemptions,
        "semesters": semesters
    };

    return result;
}
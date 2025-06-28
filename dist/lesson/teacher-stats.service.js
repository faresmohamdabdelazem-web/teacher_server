"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherStatsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const teacher_stats_entity_1 = require("./entities/teacher-stats.entity");
const lesson_entity_1 = require("./entities/lesson.entity");
const lesson_attendance_entity_1 = require("./entities/lesson-attendance.entity");
let TeacherStatsService = class TeacherStatsService {
    constructor(teacherStatsRepository, lessonRepository, attendanceRepository) {
        this.teacherStatsRepository = teacherStatsRepository;
        this.lessonRepository = lessonRepository;
        this.attendanceRepository = attendanceRepository;
    }
    async onLessonCreated(lesson) {
        const currentDate = new Date();
        await this.updateStatsForLessonWithDate(lesson, 'created', {
            totalLessons: 1
        }, currentDate);
    }
    async onStudentAddedToLesson(lessonId) {
        const lesson = await this.lessonRepository.findOne({
            where: { id: lessonId },
            relations: ['students']
        });
        if (lesson) {
            const currentDate = new Date();
            await this.updateStatsForLessonWithDate(lesson, 'student_added', {
                totalStudents: 1
            }, currentDate);
        }
    }
    async onStudentRemovedFromLesson(lessonId) {
        const lesson = await this.lessonRepository.findOne({
            where: { id: lessonId },
            relations: ['students']
        });
        if (lesson) {
            const currentDate = new Date();
            await this.updateStatsForLessonWithDate(lesson, 'student_removed', {
                totalStudents: -1
            }, currentDate);
        }
    }
    async onAttendanceMarked(lessonId) {
        const lesson = await this.lessonRepository.findOne({
            where: { id: lessonId },
            relations: ['students']
        });
        if (lesson) {
            const lessonDate = new Date(lesson.scheduledDate);
            await this.updateStatsForLessonWithDate(lesson, 'attendance_marked', {
                totalAttendance: 1
            }, lessonDate);
        }
    }
    async onLessonStatusChanged(lesson, oldStatus, originalDate) {
        const updates = {};
        if (oldStatus) {
            if (oldStatus === lesson_entity_1.LessonStatus.COMPLETED) {
                updates.completedLessons = -1;
            }
            else if (oldStatus === lesson_entity_1.LessonStatus.CANCELLED) {
                updates.cancelledLessons = -1;
            }
            else if (oldStatus === lesson_entity_1.LessonStatus.EXPIRED) {
                updates.expiredLessons = -1;
            }
        }
        if (lesson.status === lesson_entity_1.LessonStatus.COMPLETED) {
            updates.completedLessons = (updates.completedLessons || 0) + 1;
        }
        else if (lesson.status === lesson_entity_1.LessonStatus.CANCELLED) {
            updates.cancelledLessons = (updates.cancelledLessons || 0) + 1;
        }
        else if (lesson.status === lesson_entity_1.LessonStatus.EXPIRED) {
            updates.expiredLessons = (updates.expiredLessons || 0) + 1;
        }
        const currentDate = new Date();
        await this.updateStatsForLessonWithDate(lesson, 'status_changed', updates, currentDate);
    }
    async onLessonCompleted(lesson) {
        console.log('TeacherStatsService - onLessonCompleted called with lesson:', {
            lessonId: lesson.id,
            title: lesson.title,
            pricingType: lesson.pricingType,
            price: lesson.price,
            priceType: typeof lesson.price,
            scheduledDate: lesson.scheduledDate,
            teacherId: lesson.teacherId,
            studentsCount: lesson.students?.length || 0,
            students: lesson.students?.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName })) || []
        });
        let earnings = 0;
        const lessonPrice = parseFloat(lesson.price?.toString()) || 0;
        console.log('TeacherStatsService - Initial values:', {
            lessonPrice,
            lessonPriceType: typeof lessonPrice,
            pricingType: lesson.pricingType
        });
        if (lesson.pricingType === 'monthly') {
            console.log('TeacherStatsService - Processing monthly pricing');
            const lessonScheduledDate = new Date(lesson.scheduledDate);
            const monthKey = `${lessonScheduledDate.getFullYear()}-${lessonScheduledDate.getMonth() + 1}`;
            console.log('TeacherStatsService - Monthly calculation details:', {
                lessonScheduledDate: lessonScheduledDate.toISOString(),
                monthKey,
                year: lessonScheduledDate.getFullYear(),
                month: lessonScheduledDate.getMonth() + 1
            });
            const monthStart = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), 1);
            const monthEnd = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth() + 1, 0, 23, 59, 59, 999);
            console.log('TeacherStatsService - Month range:', {
                monthStart: monthStart.toISOString(),
                monthEnd: monthEnd.toISOString()
            });
            const completedLessonsInMonth = await this.lessonRepository.find({
                where: {
                    teacherId: lesson.teacherId,
                    id: lesson.id,
                    status: lesson_entity_1.LessonStatus.COMPLETED,
                    scheduledDate: (0, typeorm_2.Between)(monthStart, monthEnd)
                },
                order: { scheduledDate: 'ASC' }
            });
            const otherCompletedLessonsInMonth = completedLessonsInMonth.filter(l => l.scheduledDate.getTime() !== lessonScheduledDate.getTime());
            console.log('TeacherStatsService - Completed lessons in month:', {
                count: completedLessonsInMonth.length,
                otherCompletedCount: otherCompletedLessonsInMonth.length,
                lessons: completedLessonsInMonth.map(l => ({
                    id: l.id,
                    scheduledDate: l.scheduledDate,
                    status: l.status,
                    isCurrentLesson: l.scheduledDate.getTime() === lessonScheduledDate.getTime()
                }))
            });
            const isFirstOccurrenceInMonth = otherCompletedLessonsInMonth.length === 0;
            console.log('TeacherStatsService - First occurrence check:', {
                isFirstOccurrenceInMonth,
                completedLessonsInMonth: completedLessonsInMonth.length,
                otherCompletedLessonsInMonth: otherCompletedLessonsInMonth.length
            });
            if (isFirstOccurrenceInMonth) {
                const enrolledStudentsCount = lesson.students?.length || 0;
                earnings = lessonPrice * enrolledStudentsCount;
                console.log('TeacherStatsService - Monthly pricing earnings calculation (first occurrence in month):', {
                    lessonId: lesson.id,
                    lessonPrice,
                    enrolledStudentsCount,
                    calculatedEarnings: earnings,
                    pricingType: lesson.pricingType,
                    monthKey,
                    isFirstOccurrenceInMonth,
                    totalCompletedInMonth: completedLessonsInMonth.length
                });
            }
            else {
                console.log('TeacherStatsService - Skipping earnings for subsequent occurrence in month:', {
                    lessonId: lesson.id,
                    pricingType: lesson.pricingType,
                    monthKey,
                    isFirstOccurrenceInMonth,
                    totalCompletedInMonth: completedLessonsInMonth.length
                });
            }
        }
        else {
            console.log('TeacherStatsService - Processing per_lesson pricing');
            const presentStudentsCount = await this.attendanceRepository.count({
                where: {
                    lessonId: lesson.id,
                    status: lesson_attendance_entity_1.AttendanceStatus.PRESENT
                }
            });
            earnings = lessonPrice * presentStudentsCount;
            console.log('TeacherStatsService - Per lesson pricing earnings calculation:', {
                lessonId: lesson.id,
                lessonPrice,
                presentStudentsCount,
                calculatedEarnings: earnings,
                pricingType: lesson.pricingType
            });
        }
        console.log('TeacherStatsService - Final earnings calculation:', {
            earnings,
            earningsType: typeof earnings
        });
        const updates = {
            completedLessons: 1,
            totalEarnings: earnings
        };
        console.log('TeacherStatsService - Updates object:', updates);
        const lessonDate = new Date(lesson.scheduledDate);
        console.log('TeacherStatsService - Using lesson date for stats:', lessonDate.toISOString());
        await this.updateStatsForLessonWithDate(lesson, 'completed', updates, lessonDate);
    }
    async updateStatsForLesson(lesson, action, changes) {
        const lessonDate = new Date(lesson.scheduledDate);
        await this.updateStatsForLessonWithDate(lesson, action, changes, lessonDate);
    }
    async updateStatsForLessonWithDate(lesson, action, changes, lessonDate) {
        console.log('TeacherStatsService - Updating stats with date:', {
            action,
            lessonId: lesson.id,
            lessonDate: lessonDate.toISOString().split('T')[0],
            changes
        });
        await this.updateDailyStats(lesson, lessonDate, changes);
        await this.updateWeeklyStats(lesson, lessonDate, changes);
        await this.updateMonthlyStats(lesson, lessonDate, changes);
    }
    async updateDailyStats(lesson, lessonDate, changes) {
        const dateKey = lessonDate.toISOString().split('T')[0];
        let dailyStats = await this.teacherStatsRepository.findOne({
            where: {
                teacherId: lesson.teacherId,
                period: teacher_stats_entity_1.StatsPeriod.DAILY,
                date: lessonDate
            }
        });
        if (!dailyStats) {
            dailyStats = this.teacherStatsRepository.create({
                teacherId: lesson.teacherId,
                period: teacher_stats_entity_1.StatsPeriod.DAILY,
                date: lessonDate,
                totalLessons: 0,
                totalStudents: 0,
                totalAttendance: 0,
                totalEarnings: 0,
                completedLessons: 0,
                cancelledLessons: 0,
                expiredLessons: 0,
                averageEarningsPerLesson: 0,
                averageStudentsPerLesson: 0,
                completionRate: 0
            });
        }
        if (changes.totalLessons) {
            dailyStats.totalLessons += changes.totalLessons;
        }
        if (changes.totalStudents) {
            dailyStats.totalStudents += changes.totalStudents;
        }
        if (changes.totalAttendance) {
            dailyStats.totalAttendance += changes.totalAttendance;
        }
        if (changes.totalEarnings) {
            const currentEarnings = parseFloat(dailyStats.totalEarnings.toString()) || 0;
            const newEarnings = parseFloat(changes.totalEarnings.toString()) || 0;
            dailyStats.totalEarnings = currentEarnings + newEarnings;
            console.log('TeacherStatsService - Updating earnings:', {
                current: currentEarnings,
                adding: newEarnings,
                newTotal: dailyStats.totalEarnings
            });
        }
        if (changes.completedLessons) {
            dailyStats.completedLessons += changes.completedLessons;
        }
        if (changes.cancelledLessons) {
            dailyStats.cancelledLessons += changes.cancelledLessons;
        }
        if (changes.expiredLessons) {
            dailyStats.expiredLessons += changes.expiredLessons;
        }
        const totalLessons = dailyStats.totalLessons;
        const totalEarnings = parseFloat(dailyStats.totalEarnings.toString()) || 0;
        const totalStudents = dailyStats.totalStudents;
        const completedLessons = dailyStats.completedLessons;
        dailyStats.averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
        dailyStats.averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;
        dailyStats.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        console.log('TeacherStatsService - Daily stats after update:', {
            date: lessonDate.toISOString().split('T')[0],
            totalLessons: dailyStats.totalLessons,
            totalStudents: dailyStats.totalStudents,
            totalAttendance: dailyStats.totalAttendance,
            totalEarnings: dailyStats.totalEarnings,
            completedLessons: dailyStats.completedLessons,
            completionRate: dailyStats.completionRate
        });
        await this.teacherStatsRepository.save(dailyStats);
    }
    async updateWeeklyStats(lesson, lessonDate, changes) {
        const weekStart = this.getWeekStart(lessonDate);
        let weeklyStats = await this.teacherStatsRepository.findOne({
            where: {
                teacherId: lesson.teacherId,
                period: teacher_stats_entity_1.StatsPeriod.WEEKLY,
                date: weekStart
            }
        });
        if (!weeklyStats) {
            weeklyStats = this.teacherStatsRepository.create({
                teacherId: lesson.teacherId,
                period: teacher_stats_entity_1.StatsPeriod.WEEKLY,
                date: weekStart,
                totalLessons: 0,
                totalStudents: 0,
                totalAttendance: 0,
                totalEarnings: 0,
                completedLessons: 0,
                cancelledLessons: 0,
                expiredLessons: 0,
                averageEarningsPerLesson: 0,
                averageStudentsPerLesson: 0,
                completionRate: 0
            });
        }
        if (changes.totalLessons) {
            weeklyStats.totalLessons += changes.totalLessons;
        }
        if (changes.totalStudents) {
            weeklyStats.totalStudents += changes.totalStudents;
        }
        if (changes.totalAttendance) {
            weeklyStats.totalAttendance += changes.totalAttendance;
        }
        if (changes.totalEarnings) {
            const currentEarnings = parseFloat(weeklyStats.totalEarnings.toString()) || 0;
            const newEarnings = parseFloat(changes.totalEarnings.toString()) || 0;
            weeklyStats.totalEarnings = currentEarnings + newEarnings;
        }
        if (changes.completedLessons) {
            weeklyStats.completedLessons += changes.completedLessons;
        }
        if (changes.cancelledLessons) {
            weeklyStats.cancelledLessons += changes.cancelledLessons;
        }
        if (changes.expiredLessons) {
            weeklyStats.expiredLessons += changes.expiredLessons;
        }
        const totalLessons = weeklyStats.totalLessons;
        const totalEarnings = parseFloat(weeklyStats.totalEarnings.toString()) || 0;
        const totalStudents = weeklyStats.totalStudents;
        const completedLessons = weeklyStats.completedLessons;
        weeklyStats.averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
        weeklyStats.averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;
        weeklyStats.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        await this.teacherStatsRepository.save(weeklyStats);
    }
    async updateMonthlyStats(lesson, lessonDate, changes) {
        const monthStart = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), 1);
        let monthlyStats = await this.teacherStatsRepository.findOne({
            where: {
                teacherId: lesson.teacherId,
                period: teacher_stats_entity_1.StatsPeriod.MONTHLY,
                date: monthStart
            }
        });
        if (!monthlyStats) {
            monthlyStats = this.teacherStatsRepository.create({
                teacherId: lesson.teacherId,
                period: teacher_stats_entity_1.StatsPeriod.MONTHLY,
                date: monthStart,
                totalLessons: 0,
                totalStudents: 0,
                totalAttendance: 0,
                totalEarnings: 0,
                completedLessons: 0,
                cancelledLessons: 0,
                expiredLessons: 0,
                averageEarningsPerLesson: 0,
                averageStudentsPerLesson: 0,
                completionRate: 0
            });
        }
        if (changes.totalLessons) {
            monthlyStats.totalLessons += changes.totalLessons;
        }
        if (changes.totalStudents) {
            monthlyStats.totalStudents += changes.totalStudents;
        }
        if (changes.totalAttendance) {
            monthlyStats.totalAttendance += changes.totalAttendance;
        }
        if (changes.totalEarnings) {
            const currentEarnings = parseFloat(monthlyStats.totalEarnings.toString()) || 0;
            const newEarnings = parseFloat(changes.totalEarnings.toString()) || 0;
            monthlyStats.totalEarnings = currentEarnings + newEarnings;
        }
        if (changes.completedLessons) {
            monthlyStats.completedLessons += changes.completedLessons;
        }
        if (changes.cancelledLessons) {
            monthlyStats.cancelledLessons += changes.cancelledLessons;
        }
        if (changes.expiredLessons) {
            monthlyStats.expiredLessons += changes.expiredLessons;
        }
        const totalLessons = monthlyStats.totalLessons;
        const totalEarnings = parseFloat(monthlyStats.totalEarnings.toString()) || 0;
        const totalStudents = monthlyStats.totalStudents;
        const completedLessons = monthlyStats.completedLessons;
        monthlyStats.averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
        monthlyStats.averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;
        monthlyStats.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        await this.teacherStatsRepository.save(monthlyStats);
    }
    getWeekStart(date) {
        const dayOfWeek = date.getDay();
        const weekStart = new Date(date);
        const daysToSubtract = (dayOfWeek + 1) % 7;
        weekStart.setDate(date.getDate() - daysToSubtract);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }
    async getTeacherStats(teacherId, period, startDate, endDate) {
        console.log('TeacherStatsService - Getting stats for teacher:', teacherId);
        console.log('TeacherStatsService - Period:', period);
        console.log('TeacherStatsService - StartDate:', startDate);
        console.log('TeacherStatsService - EndDate:', endDate);
        let query = this.teacherStatsRepository.createQueryBuilder('stats')
            .where('stats.teacherId = :teacherId', { teacherId })
            .andWhere('stats.period = :period', { period });
        if (startDate && endDate) {
            query = query.andWhere('stats.date BETWEEN :startDate AND :endDate', { startDate, endDate });
        }
        const stats = await query.orderBy('stats.date', 'ASC').getMany();
        console.log('TeacherStatsService - Found stats records:', stats.length);
        console.log('TeacherStatsService - Raw stats data:', JSON.stringify(stats, null, 2));
        if (stats.length === 0) {
            console.log('TeacherStatsService - No stats found, returning empty data');
            return {
                teacherId,
                period,
                stats: []
            };
        }
        return {
            teacherId,
            period,
            stats: stats.map(stat => {
                console.log('TeacherStatsService - Processing stat:', stat);
                console.log('TeacherStatsService - Stat date type:', typeof stat.date);
                console.log('TeacherStatsService - Stat date value:', stat.date);
                console.log('TeacherStatsService - Stat totalEarnings type:', typeof stat.totalEarnings);
                console.log('TeacherStatsService - Stat totalEarnings value:', stat.totalEarnings);
                return {
                    date: new Date(stat.date).toISOString().split('T')[0],
                    totalLessons: stat.totalLessons,
                    totalStudents: stat.totalStudents,
                    totalAttendance: stat.totalAttendance,
                    totalEarnings: parseFloat(stat.totalEarnings.toString()),
                    averageEarningsPerLesson: parseFloat(stat.averageEarningsPerLesson.toString()),
                    averageStudentsPerLesson: parseFloat(stat.averageStudentsPerLesson.toString()),
                    completionRate: parseFloat(stat.completionRate.toString()),
                    completedLessons: stat.completedLessons,
                    cancelledLessons: stat.cancelledLessons,
                    expiredLessons: stat.expiredLessons
                };
            })
        };
    }
    async initializeStatsForTeacher(teacherId) {
        console.log('TeacherStatsService - Initializing stats for teacher:', teacherId);
        const lessons = await this.lessonRepository.find({
            where: { teacherId },
            relations: ['students']
        });
        console.log('TeacherStatsService - Found lessons for initialization:', lessons.length);
        const lessonsByDate = new Map();
        lessons.forEach(lesson => {
            const lessonDate = new Date(lesson.scheduledDate);
            const dateKey = lessonDate.toISOString().split('T')[0];
            console.log('TeacherStatsService - Lesson date processing:', {
                lessonId: lesson.id,
                originalScheduledDate: lesson.scheduledDate,
                lessonDate: lessonDate,
                dateKey: dateKey
            });
            if (!lessonsByDate.has(dateKey)) {
                lessonsByDate.set(dateKey, []);
            }
            lessonsByDate.get(dateKey).push(lesson);
        });
        console.log('TeacherStatsService - Lessons grouped by date:', Array.from(lessonsByDate.entries()).map(([date, lessons]) => ({
            date,
            lessonCount: lessons.length,
            lessonIds: lessons.map(l => l.id)
        })));
        const lessonIds = lessons.map(l => l.id);
        const attendanceData = await this.attendanceRepository.find({
            where: { lessonId: (0, typeorm_2.In)(lessonIds) }
        });
        const attendanceByLesson = attendanceData.reduce((acc, attendance) => {
            if (!acc[attendance.lessonId]) {
                acc[attendance.lessonId] = [];
            }
            acc[attendance.lessonId].push(attendance);
            return acc;
        }, {});
        for (const [dateKey, dayLessons] of lessonsByDate) {
            const lessonDate = new Date(dateKey);
            const totalLessons = dayLessons.length;
            const totalStudents = dayLessons.reduce((sum, lesson) => sum + lesson.students.length, 0);
            const totalEarnings = dayLessons.reduce((sum, lesson) => {
                if (lesson.status === lesson_entity_1.LessonStatus.COMPLETED) {
                    const lessonPrice = parseFloat(lesson.price?.toString() || '0');
                    if (lesson.pricingType === 'monthly') {
                        const lessonScheduledDate = new Date(lesson.scheduledDate);
                        const monthKey = `${lessonScheduledDate.getFullYear()}-${lessonScheduledDate.getMonth() + 1}`;
                        const monthStart = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), 1);
                        const monthEnd = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth() + 1, 0, 23, 59, 59, 999);
                        const completedLessonsInMonth = dayLessons.filter(l => l.id === lesson.id &&
                            l.status === lesson_entity_1.LessonStatus.COMPLETED &&
                            l.scheduledDate >= monthStart &&
                            l.scheduledDate <= monthEnd);
                        const otherCompletedLessonsInMonth = completedLessonsInMonth.filter(l => l.scheduledDate.getTime() !== lessonScheduledDate.getTime());
                        console.log('TeacherStatsService - Completed lessons in month:', {
                            count: completedLessonsInMonth.length,
                            otherCompletedCount: otherCompletedLessonsInMonth.length,
                            lessons: completedLessonsInMonth.map(l => ({
                                id: l.id,
                                scheduledDate: l.scheduledDate,
                                status: l.status,
                                isCurrentLesson: l.scheduledDate.getTime() === lessonScheduledDate.getTime()
                            }))
                        });
                        const isFirstOccurrenceInMonth = otherCompletedLessonsInMonth.length === 0;
                        if (isFirstOccurrenceInMonth) {
                            const enrolledStudentsCount = lesson.students?.length || 0;
                            const lessonEarnings = lessonPrice * enrolledStudentsCount;
                            console.log(`TeacherStatsService - Completed lesson ${lesson.id} earnings (monthly):`, {
                                lessonPrice,
                                enrolledStudentsCount,
                                lessonEarnings,
                                monthKey,
                                isFirstOccurrenceInMonth,
                                totalOccurrencesInMonth: completedLessonsInMonth.length
                            });
                            return sum + lessonEarnings;
                        }
                        else {
                            console.log(`TeacherStatsService - Skipping earnings for subsequent occurrence in month ${lesson.id}:`, {
                                monthKey,
                                isFirstOccurrenceInMonth,
                                totalOccurrencesInMonth: completedLessonsInMonth.length
                            });
                            return sum;
                        }
                    }
                    else {
                        const presentStudentsCount = attendanceByLesson[lesson.id]?.filter(attendance => attendance.status === lesson_attendance_entity_1.AttendanceStatus.PRESENT).length || 0;
                        const lessonEarnings = lessonPrice * presentStudentsCount;
                        console.log(`TeacherStatsService - Completed lesson ${lesson.id} earnings (per_lesson):`, {
                            lessonPrice,
                            presentStudentsCount,
                            lessonEarnings
                        });
                        return sum + lessonEarnings;
                    }
                }
                return sum;
            }, 0);
            const totalAttendance = dayLessons.reduce((sum, lesson) => {
                const presentStudentsCount = attendanceByLesson[lesson.id]?.filter(attendance => attendance.status === lesson_attendance_entity_1.AttendanceStatus.PRESENT).length || 0;
                return sum + presentStudentsCount;
            }, 0);
            const completedLessons = dayLessons.filter(l => l.status === lesson_entity_1.LessonStatus.COMPLETED).length;
            const cancelledLessons = dayLessons.filter(l => l.status === lesson_entity_1.LessonStatus.CANCELLED).length;
            const expiredLessons = dayLessons.filter(l => l.status === lesson_entity_1.LessonStatus.EXPIRED).length;
            let dailyStats = await this.teacherStatsRepository.findOne({
                where: {
                    teacherId,
                    period: teacher_stats_entity_1.StatsPeriod.DAILY,
                    date: lessonDate
                }
            });
            if (!dailyStats) {
                dailyStats = this.teacherStatsRepository.create({
                    teacherId,
                    period: teacher_stats_entity_1.StatsPeriod.DAILY,
                    date: lessonDate,
                    totalLessons: 0,
                    totalStudents: 0,
                    totalAttendance: 0,
                    totalEarnings: 0,
                    completedLessons: 0,
                    cancelledLessons: 0,
                    expiredLessons: 0,
                    averageEarningsPerLesson: 0,
                    averageStudentsPerLesson: 0,
                    completionRate: 0
                });
            }
            dailyStats.totalLessons = totalLessons;
            dailyStats.totalStudents = totalStudents;
            dailyStats.totalAttendance = totalAttendance;
            dailyStats.totalEarnings = totalEarnings;
            dailyStats.completedLessons = completedLessons;
            dailyStats.cancelledLessons = cancelledLessons;
            dailyStats.expiredLessons = expiredLessons;
            dailyStats.averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
            dailyStats.averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;
            dailyStats.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
            await this.teacherStatsRepository.save(dailyStats);
            await this.updateWeeklyStatsFromDaily(teacherId, lessonDate);
            await this.updateMonthlyStatsFromDaily(teacherId, lessonDate);
        }
        console.log('TeacherStatsService - Stats initialization completed for teacher:', teacherId);
    }
    async updateWeeklyStatsFromDaily(teacherId, lessonDate) {
        const weekStart = this.getWeekStart(lessonDate);
        let weeklyStats = await this.teacherStatsRepository.findOne({
            where: {
                teacherId,
                period: teacher_stats_entity_1.StatsPeriod.WEEKLY,
                date: weekStart
            }
        });
        if (!weeklyStats) {
            weeklyStats = this.teacherStatsRepository.create({
                teacherId,
                period: teacher_stats_entity_1.StatsPeriod.WEEKLY,
                date: weekStart,
                totalLessons: 0,
                totalStudents: 0,
                totalAttendance: 0,
                totalEarnings: 0,
                completedLessons: 0,
                cancelledLessons: 0,
                expiredLessons: 0,
                averageEarningsPerLesson: 0,
                averageStudentsPerLesson: 0,
                completionRate: 0
            });
        }
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const dailyStatsForWeek = await this.teacherStatsRepository.find({
            where: {
                teacherId,
                period: teacher_stats_entity_1.StatsPeriod.DAILY,
                date: (0, typeorm_2.Between)(weekStart, weekEnd)
            }
        });
        weeklyStats.totalLessons = dailyStatsForWeek.reduce((sum, stat) => sum + stat.totalLessons, 0);
        weeklyStats.totalStudents = dailyStatsForWeek.reduce((sum, stat) => sum + stat.totalStudents, 0);
        weeklyStats.totalAttendance = dailyStatsForWeek.reduce((sum, stat) => sum + stat.totalAttendance, 0);
        weeklyStats.totalEarnings = dailyStatsForWeek.reduce((sum, stat) => sum + parseFloat(stat.totalEarnings.toString()), 0);
        weeklyStats.completedLessons = dailyStatsForWeek.reduce((sum, stat) => sum + stat.completedLessons, 0);
        weeklyStats.cancelledLessons = dailyStatsForWeek.reduce((sum, stat) => sum + stat.cancelledLessons, 0);
        weeklyStats.expiredLessons = dailyStatsForWeek.reduce((sum, stat) => sum + stat.expiredLessons, 0);
        weeklyStats.averageEarningsPerLesson = weeklyStats.totalLessons > 0 ? weeklyStats.totalEarnings / weeklyStats.totalLessons : 0;
        weeklyStats.averageStudentsPerLesson = weeklyStats.totalLessons > 0 ? weeklyStats.totalStudents / weeklyStats.totalLessons : 0;
        weeklyStats.completionRate = weeklyStats.totalLessons > 0 ? (weeklyStats.completedLessons / weeklyStats.totalLessons) * 100 : 0;
        await this.teacherStatsRepository.save(weeklyStats);
    }
    async updateMonthlyStatsFromDaily(teacherId, lessonDate) {
        const monthStart = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), 1);
        let monthlyStats = await this.teacherStatsRepository.findOne({
            where: {
                teacherId,
                period: teacher_stats_entity_1.StatsPeriod.MONTHLY,
                date: monthStart
            }
        });
        if (!monthlyStats) {
            monthlyStats = this.teacherStatsRepository.create({
                teacherId,
                period: teacher_stats_entity_1.StatsPeriod.MONTHLY,
                date: monthStart,
                totalLessons: 0,
                totalStudents: 0,
                totalAttendance: 0,
                totalEarnings: 0,
                completedLessons: 0,
                cancelledLessons: 0,
                expiredLessons: 0,
                averageEarningsPerLesson: 0,
                averageStudentsPerLesson: 0,
                completionRate: 0
            });
        }
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthStart.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        const dailyStatsForMonth = await this.teacherStatsRepository.find({
            where: {
                teacherId,
                period: teacher_stats_entity_1.StatsPeriod.DAILY,
                date: (0, typeorm_2.Between)(monthStart, monthEnd)
            }
        });
        monthlyStats.totalLessons = dailyStatsForMonth.reduce((sum, stat) => sum + stat.totalLessons, 0);
        monthlyStats.totalStudents = dailyStatsForMonth.reduce((sum, stat) => sum + stat.totalStudents, 0);
        monthlyStats.totalAttendance = dailyStatsForMonth.reduce((sum, stat) => sum + stat.totalAttendance, 0);
        monthlyStats.totalEarnings = dailyStatsForMonth.reduce((sum, stat) => sum + parseFloat(stat.totalEarnings.toString()), 0);
        monthlyStats.completedLessons = dailyStatsForMonth.reduce((sum, stat) => sum + stat.completedLessons, 0);
        monthlyStats.cancelledLessons = dailyStatsForMonth.reduce((sum, stat) => sum + stat.cancelledLessons, 0);
        monthlyStats.expiredLessons = dailyStatsForMonth.reduce((sum, stat) => sum + stat.expiredLessons, 0);
        monthlyStats.averageEarningsPerLesson = monthlyStats.totalLessons > 0 ? monthlyStats.totalEarnings / monthlyStats.totalLessons : 0;
        monthlyStats.averageStudentsPerLesson = monthlyStats.totalLessons > 0 ? monthlyStats.totalStudents / monthlyStats.totalLessons : 0;
        monthlyStats.completionRate = monthlyStats.totalLessons > 0 ? (monthlyStats.completedLessons / monthlyStats.totalLessons) * 100 : 0;
        await this.teacherStatsRepository.save(monthlyStats);
    }
    async recalculateTeacherStats(teacherId) {
        console.log('TeacherStatsService - Recalculating stats for teacher:', teacherId);
        const lessons = await this.lessonRepository.find({
            where: { teacherId },
            relations: ['students']
        });
        console.log('TeacherStatsService - Found lessons for recalculation:', lessons.length);
        lessons.forEach((lesson, index) => {
            console.log(`TeacherStatsService - Lesson ${index + 1}:`, {
                id: lesson.id,
                price: lesson.price,
                priceType: typeof lesson.price,
                scheduledDate: lesson.scheduledDate,
                status: lesson.status,
                studentsCount: lesson.students.length
            });
        });
        const lessonIds = lessons.map(l => l.id);
        const attendanceData = await this.attendanceRepository.find({
            where: { lessonId: (0, typeorm_2.In)(lessonIds) }
        });
        const lessonsByDate = new Map();
        lessons.forEach(lesson => {
            const lessonDate = new Date(lesson.scheduledDate);
            const dateKey = lessonDate.toISOString().split('T')[0];
            console.log('TeacherStatsService - Lesson date processing:', {
                lessonId: lesson.id,
                originalScheduledDate: lesson.scheduledDate,
                lessonDate: lessonDate,
                dateKey: dateKey
            });
            if (!lessonsByDate.has(dateKey)) {
                lessonsByDate.set(dateKey, []);
            }
            lessonsByDate.get(dateKey).push(lesson);
        });
        console.log('TeacherStatsService - Lessons grouped by date:', Array.from(lessonsByDate.entries()).map(([date, lessons]) => ({
            date,
            lessonCount: lessons.length,
            lessonIds: lessons.map(l => l.id)
        })));
        const attendanceByLesson = attendanceData.reduce((acc, attendance) => {
            if (!acc[attendance.lessonId]) {
                acc[attendance.lessonId] = [];
            }
            acc[attendance.lessonId].push(attendance);
            return acc;
        }, {});
        for (const [dateKey, dayLessons] of lessonsByDate) {
            const lessonDate = new Date(dateKey);
            console.log('TeacherStatsService - Processing date:', dateKey, 'with lessons:', dayLessons.length);
            const totalLessons = dayLessons.length;
            const totalStudents = dayLessons.reduce((sum, lesson) => sum + lesson.students.length, 0);
            const totalEarnings = dayLessons.reduce((sum, lesson) => {
                if (lesson.status === lesson_entity_1.LessonStatus.COMPLETED) {
                    const lessonPrice = parseFloat(lesson.price?.toString() || '0');
                    if (lesson.pricingType === 'monthly') {
                        const lessonScheduledDate = new Date(lesson.scheduledDate);
                        const monthKey = `${lessonScheduledDate.getFullYear()}-${lessonScheduledDate.getMonth() + 1}`;
                        const monthStart = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), 1);
                        const monthEnd = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth() + 1, 0, 23, 59, 59, 999);
                        const completedLessonsInMonth = dayLessons.filter(l => l.id === lesson.id &&
                            l.status === lesson_entity_1.LessonStatus.COMPLETED &&
                            l.scheduledDate >= monthStart &&
                            l.scheduledDate <= monthEnd);
                        const otherCompletedLessonsInMonth = completedLessonsInMonth.filter(l => l.scheduledDate.getTime() !== lessonScheduledDate.getTime());
                        console.log('TeacherStatsService - Completed lessons in month:', {
                            count: completedLessonsInMonth.length,
                            otherCompletedCount: otherCompletedLessonsInMonth.length,
                            lessons: completedLessonsInMonth.map(l => ({
                                id: l.id,
                                scheduledDate: l.scheduledDate,
                                status: l.status,
                                isCurrentLesson: l.scheduledDate.getTime() === lessonScheduledDate.getTime()
                            }))
                        });
                        const isFirstOccurrenceInMonth = otherCompletedLessonsInMonth.length === 0;
                        if (isFirstOccurrenceInMonth) {
                            const enrolledStudentsCount = lesson.students?.length || 0;
                            const lessonEarnings = lessonPrice * enrolledStudentsCount;
                            console.log(`TeacherStatsService - Completed lesson ${lesson.id} earnings (monthly):`, {
                                lessonPrice,
                                enrolledStudentsCount,
                                lessonEarnings,
                                monthKey,
                                isFirstOccurrenceInMonth,
                                totalOccurrencesInMonth: completedLessonsInMonth.length
                            });
                            return sum + lessonEarnings;
                        }
                        else {
                            console.log(`TeacherStatsService - Skipping earnings for subsequent occurrence in month ${lesson.id}:`, {
                                monthKey,
                                isFirstOccurrenceInMonth,
                                totalOccurrencesInMonth: completedLessonsInMonth.length
                            });
                            return sum;
                        }
                    }
                    else {
                        const presentStudentsCount = attendanceByLesson[lesson.id]?.filter(attendance => attendance.status === lesson_attendance_entity_1.AttendanceStatus.PRESENT).length || 0;
                        const lessonEarnings = lessonPrice * presentStudentsCount;
                        console.log(`TeacherStatsService - Completed lesson ${lesson.id} earnings (per_lesson):`, {
                            lessonPrice,
                            presentStudentsCount,
                            lessonEarnings
                        });
                        return sum + lessonEarnings;
                    }
                }
                return sum;
            }, 0);
            const totalAttendance = dayLessons.reduce((sum, lesson) => {
                const presentStudentsCount = attendanceByLesson[lesson.id]?.filter(attendance => attendance.status === lesson_attendance_entity_1.AttendanceStatus.PRESENT).length || 0;
                return sum + presentStudentsCount;
            }, 0);
            const completedLessons = dayLessons.filter(l => l.status === lesson_entity_1.LessonStatus.COMPLETED).length;
            const cancelledLessons = dayLessons.filter(l => l.status === lesson_entity_1.LessonStatus.CANCELLED).length;
            const expiredLessons = dayLessons.filter(l => l.status === lesson_entity_1.LessonStatus.EXPIRED).length;
            console.log('TeacherStatsService - Calculated values for', dateKey, ':', {
                totalLessons,
                totalStudents,
                totalEarnings,
                totalEarningsType: typeof totalEarnings,
                totalAttendance,
                completedLessons,
                cancelledLessons,
                expiredLessons
            });
            let dailyStats = await this.teacherStatsRepository.findOne({
                where: {
                    teacherId,
                    period: teacher_stats_entity_1.StatsPeriod.DAILY,
                    date: lessonDate
                }
            });
            if (!dailyStats) {
                dailyStats = this.teacherStatsRepository.create({
                    teacherId,
                    period: teacher_stats_entity_1.StatsPeriod.DAILY,
                    date: lessonDate,
                    totalLessons: 0,
                    totalStudents: 0,
                    totalAttendance: 0,
                    totalEarnings: 0,
                    completedLessons: 0,
                    cancelledLessons: 0,
                    expiredLessons: 0,
                    averageEarningsPerLesson: 0,
                    averageStudentsPerLesson: 0,
                    completionRate: 0
                });
            }
            dailyStats.totalLessons = totalLessons;
            dailyStats.totalStudents = totalStudents;
            dailyStats.totalAttendance = totalAttendance;
            dailyStats.totalEarnings = totalEarnings;
            dailyStats.completedLessons = completedLessons;
            dailyStats.cancelledLessons = cancelledLessons;
            dailyStats.expiredLessons = expiredLessons;
            dailyStats.averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
            dailyStats.averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;
            dailyStats.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
            console.log('TeacherStatsService - Saving daily stats for', dateKey, ':', {
                totalLessons: dailyStats.totalLessons,
                totalStudents: dailyStats.totalStudents,
                totalAttendance: dailyStats.totalAttendance,
                totalEarnings: dailyStats.totalEarnings,
                totalEarningsType: typeof dailyStats.totalEarnings,
                completedLessons: dailyStats.completedLessons,
                completionRate: dailyStats.completionRate
            });
            await this.teacherStatsRepository.save(dailyStats);
            await this.updateWeeklyStatsFromDaily(teacherId, lessonDate);
            await this.updateMonthlyStatsFromDaily(teacherId, lessonDate);
        }
        console.log('TeacherStatsService - Stats recalculation completed for teacher:', teacherId);
    }
    async clearTeacherStats(teacherId) {
        console.log('TeacherStatsService - Clearing all stats for teacher:', teacherId);
        await this.teacherStatsRepository.delete({ teacherId });
        console.log('TeacherStatsService - All stats cleared for teacher:', teacherId);
    }
    async resetAndRecalculateTeacherStats(teacherId) {
        console.log('TeacherStatsService - Resetting and recalculating stats for teacher:', teacherId);
        await this.clearTeacherStats(teacherId);
        await this.recalculateTeacherStats(teacherId);
        console.log('TeacherStatsService - Reset and recalculation completed for teacher:', teacherId);
    }
};
exports.TeacherStatsService = TeacherStatsService;
exports.TeacherStatsService = TeacherStatsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(teacher_stats_entity_1.TeacherStats)),
    __param(1, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    __param(2, (0, typeorm_1.InjectRepository)(lesson_attendance_entity_1.LessonAttendance)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TeacherStatsService);
//# sourceMappingURL=teacher-stats.service.js.map
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LockKeyhole,
  LogOut,
  Plus,
  Pencil,
  Archive,
  RotateCcw,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import "./App.css";

const pad = (number) => String(number).padStart(2, "0");

const getToday = () => {
  const now = new Date();

  return `${now.getFullYear()}-${pad(
    now.getMonth() + 1
  )}-${pad(now.getDate())}`;
};

const formatDate = (dateString) =>
  new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

const getYearLabel = (year) => {
  if (year === 1) return "1st";
  if (year === 2) return "2nd";
  if (year === 3) return "3rd";
  return `${year}th`;
};

function App() {
  const { classSlug } = useParams();

  const [classInfo, setClassInfo] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [archivedAssignments, setArchivedAssignments] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [view, setView] = useState("list");
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] =
    useState(null);

  const [showAdmin, setShowAdmin] =
    useState(false);

  const [
    showAssignmentModal,
    setShowAssignmentModal,
  ] = useState(false);

  const [
    editingAssignment,
    setEditingAssignment,
  ] = useState(null);

  const [session, setSession] =
    useState(null);

  const [adminProfile, setAdminProfile] =
    useState(null);

  const [authLoading, setAuthLoading] =
    useState(false);

  useEffect(() => {
    loadClass();
  }, [classSlug]);

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          await loadAdminProfile(
            newSession.user.id
          );
        } else {
          setAdminProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ==========================================
  // LOAD CLASS + ASSIGNMENTS
  // ==========================================

  const loadClass = async () => {
    setLoading(true);
    setError("");

    const {
      data: classData,
      error: classError,
    } = await supabase
      .from("classes")
      .select("*")
      .eq("slug", classSlug)
      .single();

    if (classError || !classData) {
      setError(
        "This class dashboard does not exist."
      );
      setLoading(false);
      return;
    }

    setClassInfo(classData);

    // ACTIVE ASSIGNMENTS
    const {
      data: assignmentData,
      error: assignmentError,
    } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classData.id)
      .eq("archived", false)
      .gte("due_date", getToday())
      .order("due_date", {
        ascending: true,
      });

    if (assignmentError) {
      setError(
        "Unable to load assignments."
      );
      setLoading(false);
      return;
    }

    setAssignments(
      assignmentData || []
    );

    // ARCHIVED ASSIGNMENTS
    const {
      data: archivedData,
      error: archivedError,
    } = await supabase.rpc(
      "get_archived_assignments",
      {
        target_class_id: classData.id,
      }
    );

    if (archivedError) {
      console.error(
        "Archived assignments error:",
        archivedError
      );

      setArchivedAssignments([]);
    } else {
      setArchivedAssignments(
        archivedData || []
      );
    }

    setLoading(false);
  };

  // ==========================================
  // AUTH
  // ==========================================

  const checkSession = async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    setSession(currentSession);

    if (currentSession?.user) {
      await loadAdminProfile(
        currentSession.user.id
      );
    }
  };

  const loadAdminProfile = async (
    userId
  ) => {
    const {
      data,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, role, class_id"
      )
      .eq("id", userId)
      .single();

    if (!profileError) {
      setAdminProfile(data);
    } else {
      setAdminProfile(null);
    }
  };

  const handleLogin = async (
    email,
    password
  ) => {
    setAuthLoading(true);

    const {
      data,
      error: loginError,
    } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      }
    );

    if (loginError) {
      setAuthLoading(false);

      return {
        success: false,
        error:
          "Incorrect admin credentials.",
      };
    }

    await loadAdminProfile(
      data.user.id
    );

    setAuthLoading(false);

    return {
      success: true,
    };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();

    setSession(null);
    setAdminProfile(null);
  };

  const canManageThisClass =
    Boolean(session) &&
    Boolean(adminProfile) &&
    Boolean(classInfo) &&
    (adminProfile.role ===
      "master" ||
      adminProfile.class_id ===
        classInfo.id);

  // ==========================================
  // ADD
  // ==========================================

  const handleAddAssignment = async (
    assignment
  ) => {
    if (!canManageThisClass) {
      throw new Error(
        "You do not have permission to manage this class."
      );
    }

    const {
      error: insertError,
    } = await supabase
      .from("assignments")
      .insert({
        class_id: classInfo.id,
        name: assignment.name,
        due_date: assignment.dueDate,
        graded: assignment.graded,
        description:
          assignment.description ||
          null,
        archived: false,
      });

    if (insertError) {
      throw new Error(
        insertError.message
      );
    }

    await loadClass();
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEditAssignment = async (
    assignment
  ) => {
    if (!canManageThisClass) {
      throw new Error(
        "You do not have permission to edit this assignment."
      );
    }

    const {
      error: updateError,
    } = await supabase
      .from("assignments")
      .update({
        name: assignment.name,
        due_date: assignment.dueDate,
        graded: assignment.graded,
        description:
          assignment.description ||
          null,
      })
      .eq("id", assignment.id);

    if (updateError) {
      throw new Error(
        updateError.message
      );
    }

    await loadClass();
  };

  // ==========================================
  // ARCHIVE
  // ==========================================

  const handleArchiveAssignment = async (
    assignmentId
  ) => {
    if (!canManageThisClass) {
      return;
    }

    const confirmed =
      window.confirm(
        "Archive this assignment? It will move to Archived."
      );

    if (!confirmed) {
      return;
    }

    const {
      error: archiveError,
    } = await supabase.rpc(
      "archive_assignment",
      {
        assignment_id:
          assignmentId,
      }
    );

    if (archiveError) {
      console.error(
        "Archive error:",
        archiveError
      );

      window.alert(
        `Unable to archive: ${archiveError.message}`
      );

      return;
    }

    const archivedAssignment =
      assignments.find(
        (assignment) =>
          assignment.id ===
          assignmentId
      );

    if (!archivedAssignment) {
      return;
    }

    setAssignments(
      (current) =>
        current.filter(
          (assignment) =>
            assignment.id !==
            assignmentId
        )
    );

    setArchivedAssignments(
      (current) => [
        archivedAssignment,
        ...current,
      ]
    );
  };

  // ==========================================
  // RESTORE
  // ==========================================

  const handleRestoreAssignment =
    async (assignmentId) => {
      if (!canManageThisClass) {
        return;
      }

      const confirmed =
        window.confirm(
          "Restore this assignment?"
        );

      if (!confirmed) {
        return;
      }

      const {
        error: restoreError,
      } = await supabase.rpc(
        "restore_assignment",
        {
          assignment_id:
            assignmentId,
        }
      );

      if (restoreError) {
        console.error(
          "Restore error:",
          restoreError
        );

        window.alert(
          `Unable to restore: ${restoreError.message}`
        );

        return;
      }

      const restoredAssignment =
        archivedAssignments.find(
          (assignment) =>
            assignment.id ===
            assignmentId
        );

      if (!restoredAssignment) {
        return;
      }

      setArchivedAssignments(
        (current) =>
          current.filter(
            (assignment) =>
              assignment.id !==
              assignmentId
          )
      );

      if (
        restoredAssignment.due_date >=
        getToday()
      ) {
        setAssignments(
          (current) =>
            [
              ...current,
              restoredAssignment,
            ].sort(
              (a, b) =>
                new Date(
                  a.due_date
                ) -
                new Date(
                  b.due_date
                )
            )
        );
      }
    };

  // ==========================================
  // DELETE ONE
  // ==========================================

  const handleDeleteAssignment =
    async (assignmentId) => {
      if (!canManageThisClass) {
        return;
      }

      const confirmed =
        window.confirm(
          "PERMANENTLY DELETE this assignment?\n\nThis cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      const {
        error: deleteError,
      } = await supabase.rpc(
        "delete_assignment",
        {
          assignment_id:
            assignmentId,
        }
      );

      if (deleteError) {
        console.error(
          "Delete error:",
          deleteError
        );

        window.alert(
          `Unable to delete: ${deleteError.message}`
        );

        return;
      }

      setAssignments(
        (current) =>
          current.filter(
            (assignment) =>
              assignment.id !==
              assignmentId
          )
      );

      setArchivedAssignments(
        (current) =>
          current.filter(
            (assignment) =>
              assignment.id !==
              assignmentId
          )
      );
    };

  // ==========================================
  // CLEAR ARCHIVED FOR CURRENT CLASS
  // ==========================================

  const handleClearClassArchived =
    async () => {
      if (
        !canManageThisClass ||
        !classInfo
      ) {
        return;
      }

      const count =
        archivedAssignments.length;

      if (count === 0) {
        window.alert(
          "There are no archived assignments in this tracker."
        );
        return;
      }

      const confirmed =
        window.confirm(
          `⚠️ CLEAR ALL ARCHIVED ASSIGNMENTS FOR ${classInfo.department} YEAR ${classInfo.year}?\n\n` +
            `${count} archived assignment${
              count === 1
                ? ""
                : "s"
            } will be permanently deleted.\n\n` +
            "Active/upcoming assignments will NOT be affected."
        );

      if (!confirmed) {
        return;
      }

      const {
        data: deletedCount,
        error: clearError,
      } = await supabase.rpc(
        "clear_class_archived_assignments",
        {
          target_class_id:
            classInfo.id,
        }
      );

      if (clearError) {
        console.error(
          "Clear archived error:",
          clearError
        );

        window.alert(
          `Unable to clear archived assignments: ${clearError.message}`
        );

        return;
      }

      setArchivedAssignments(
        []
      );

      window.alert(
        `${deletedCount || count} archived assignment${
          (deletedCount ||
            count) === 1
            ? ""
            : "s"
        } permanently deleted.`
      );
    };

  // ==========================================
  // MASTER: CLEAR EVERYTHING
  // ==========================================

  const handleClearEverything =
    async () => {
      if (
        !session ||
        adminProfile?.role !==
          "master"
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "⚠️ MASTER-ONLY YEAR-END RESET\n\n" +
            "This will permanently delete EVERY assignment from EVERY class, year, and department.\n\n" +
            "This includes upcoming AND archived assignments.\n\n" +
            "Classes, admin accounts, profiles, and authentication will NOT be deleted.\n\n" +
            "This cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      const typed =
        window.prompt(
          'FINAL CONFIRMATION\n\nType "CLEAR EVERYTHING" to continue:'
        );

      if (
        typed !==
        "CLEAR EVERYTHING"
      ) {
        window.alert(
          "Reset cancelled. Nothing was deleted."
        );

        return;
      }

      const {
        data: deletedCount,
        error: clearError,
      } = await supabase.rpc(
        "clear_all_assignments"
      );

      if (clearError) {
        console.error(
          "Clear everything error:",
          clearError
        );

        window.alert(
          `Unable to clear assignments: ${clearError.message}`
        );

        return;
      }

      setAssignments([]);
      setArchivedAssignments([]);

      window.alert(
        `${deletedCount || 0} assignments permanently deleted across all trackers.`
      );
    };

  // ==========================================
  // MODALS
  // ==========================================

  const openAddModal = () => {
    setEditingAssignment(
      null
    );

    setShowAssignmentModal(
      true
    );
  };

  const openEditModal = (
    assignment
  ) => {
    setEditingAssignment(
      assignment
    );

    setShowAssignmentModal(
      true
    );
  };

  // ==========================================
  // STATS
  // ==========================================

  const stats = useMemo(
    () => ({
      upcoming:
        assignments.length,

      graded:
        assignments.filter(
          (item) =>
            item.graded
        ).length,

      notGraded:
        assignments.filter(
          (item) =>
            !item.graded
        ).length,

      archived:
        archivedAssignments.length,
    }),
    [
      assignments,
      archivedAssignments,
    ]
  );

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="page-state">
        <div className="loading-spinner" />

        <p>
          Loading assignments...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="page-state">
        <ClipboardList size={40} />

        <h2>
          Dashboard unavailable
        </h2>

        <p>{error}</p>
      </div>
    );
  }

  // ==========================================
  // MAIN
  // ==========================================

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <ClipboardList
              size={21}
            />
          </div>

          <div>
            <h1>
              Assignments
            </h1>

            <p>
              {getYearLabel(
                classInfo.year
              )}{" "}
              Year ·{" "}
              {
                classInfo.department
              }
            </p>
          </div>
        </div>

        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={
                view === "list"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView("list")
              }
            >
              <ClipboardList
                size={17}
              />

              List
            </button>

            <button
              className={
                view ===
                "calendar"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView(
                  "calendar"
                )
              }
            >
              <CalendarDays
                size={17}
              />

              Calendar
            </button>
          </div>

          <button
            className="admin-button"
            onClick={() =>
              setShowAdmin(
                true
              )
            }
          >
            <LockKeyhole
              size={16}
            />

            Admin
          </button>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <div>
            <span className="eyebrow">
              {
                classInfo.department
              }{" "}
              · YEAR{" "}
              {classInfo.year}
            </span>

            <h2>
              Stay ahead of
              what’s due.
            </h2>

            <p>
              Upcoming
              assignments,
              organized by
              date so you
              always know
              what comes
              next.
            </p>
          </div>

          <div className="stats">
            <div className="stat-card">
              <strong>
                {
                  stats.upcoming
                }
              </strong>

              <span>
                Upcoming
              </span>
            </div>

            <div className="stat-card">
              <strong>
                {
                  stats.graded
                }
              </strong>

              <span>
                Graded
              </span>
            </div>

            <div className="stat-card">
              <strong>
                {
                  stats.notGraded
                }
              </strong>

              <span>
                Not graded
              </span>
            </div>
          </div>
        </section>

        {/* ADMIN CONTROLS */}

        {canManageThisClass && (
          <section className="admin-controls">
            <div>
              <span className="admin-label">
                ADMIN MODE
              </span>

              <strong>
                {adminProfile.role ===
                "master"
                  ? "Master administrator"
                  : `${getYearLabel(
                      classInfo.year
                    )} Year · ${
                      classInfo.department
                    } administrator`}
              </strong>
            </div>

            <div className="admin-actions">
              <button
                className="primary-button"
                onClick={
                  openAddModal
                }
              >
                <Plus size={17} />

                Add assignment
              </button>

              <button
                className="secondary-button"
                onClick={
                  handleLogout
                }
              >
                <LogOut
                  size={16}
                />

                Sign out
              </button>

              {/* CLASS-LEVEL CLEAR */}

              <button
                className="clear-archived-button"
                onClick={
                  handleClearClassArchived
                }
              >
                <Archive
                  size={16}
                />

                Clear archived
              </button>

              {/* MASTER-ONLY CLEAR EVERYTHING */}

              {adminProfile.role ===
                "master" && (
                <button
                  className="clear-everything-button"
                  onClick={
                    handleClearEverything
                  }
                >
                  <Archive
                    size={16}
                  />

                  Clear EVERYTHING
                </button>
              )}
            </div>
          </section>
        )}

        {view === "list" ? (
          <>
            <AssignmentList
              assignments={
                assignments
              }
              canManage={
                canManageThisClass
              }
              onEdit={
                openEditModal
              }
              onArchive={
                handleArchiveAssignment
              }
              onDelete={
                handleDeleteAssignment
              }
              onAdd={
                openAddModal
              }
            />

            {/* EVERYONE CAN SEE ARCHIVED */}

            <ArchivedAssignments
              assignments={
                archivedAssignments
              }
              canManage={
                canManageThisClass
              }
              onRestore={
                handleRestoreAssignment
              }
            />
          </>
        ) : (
          <CalendarView
            month={month}
            setMonth={setMonth}
            assignments={
              assignments
            }
            onSelectDate={
              setSelectedDate
            }
          />
        )}
      </main>

      {selectedDate && (
        <DayModal
          date={selectedDate}
          assignments={assignments.filter(
            (assignment) =>
              assignment.due_date ===
              selectedDate
          )}
          onClose={() =>
            setSelectedDate(
              null
            )
          }
        />
      )}

      {showAdmin && (
        <AdminModal
          classInfo={
            classInfo
          }
          session={session}
          authLoading={
            authLoading
          }
          onLogin={
            handleLogin
          }
          onLogout={
            handleLogout
          }
          onClose={() =>
            setShowAdmin(
              false
            )
          }
        />
      )}

      {showAssignmentModal && (
        <AssignmentModal
          classInfo={
            classInfo
          }
          assignment={
            editingAssignment
          }
          onClose={() =>
            setShowAssignmentModal(
              false
            )
          }
          onSave={
            editingAssignment
              ? handleEditAssignment
              : handleAddAssignment
          }
        />
      )}
    </div>
  );
}

// ==========================================
// ASSIGNMENT LIST
// ==========================================

function AssignmentList({
  assignments,
  canManage,
  onEdit,
  onArchive,
  onDelete,
  onAdd,
}) {
  if (!assignments.length) {
    return (
      <section className="empty-state">
        <ClipboardList
          size={38}
        />

        <h3>
          Nothing due
        </h3>

        <p>
          You’re all caught
          up.
        </p>

        {canManage && (
          <button
            className="primary-button"
            onClick={onAdd}
          >
            <Plus size={17} />

            Add assignment
          </button>
        )}
      </section>
    );
  }

  let lastMonth = "";

  return (
    <section className="assignment-list">
      {assignments.map(
        (assignment) => {
          const monthName =
            new Date(
              `${assignment.due_date}T00:00:00`
            ).toLocaleDateString(
              "en-IN",
              {
                month:
                  "long",
                year: "numeric",
              }
            );

          const showMonth =
            monthName !==
            lastMonth;

          lastMonth =
            monthName;

          return (
            <div
              key={
                assignment.id
              }
            >
              {showMonth && (
                <h3 className="month-heading">
                  {
                    monthName
                  }
                </h3>
              )}

              <article className="assignment-card">
                <div className="date-block">
                  <span>
                    {new Date(
                      `${assignment.due_date}T00:00:00`
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        weekday:
                          "short",
                      }
                    )}
                  </span>

                  <strong>
                    {new Date(
                      `${assignment.due_date}T00:00:00`
                    ).getDate()}
                  </strong>
                </div>

                <div className="assignment-content">
                  <div className="assignment-top">
                    <h3>
                      {
                        assignment.name
                      }
                    </h3>

                    <span
                      className={`status ${
                        assignment.graded
                          ? "graded"
                          : "not-graded"
                      }`}
                    >
                      {assignment.graded
                        ? "Graded"
                        : "Not graded"}
                    </span>
                  </div>

                  {assignment.description && (
                    <p>
                      {
                        assignment.description
                      }
                    </p>
                  )}

                  <div className="assignment-bottom">
                    <span className="due-date">
                      Due{" "}
                      {formatDate(
                        assignment.due_date
                      )}
                    </span>

                    {canManage && (
                      <div className="assignment-actions">
                        <button
                          className="edit-button"
                          onClick={() =>
                            onEdit(
                              assignment
                            )
                          }
                        >
                          <Pencil
                            size={14}
                          />

                          Edit
                        </button>

                        <button
                          className="archive-button"
                          onClick={() =>
                            onArchive(
                              assignment.id
                            )
                          }
                        >
                          <Archive
                            size={14}
                          />

                          Archive
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            onDelete(
                              assignment.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </div>
          );
        }
      )}
    </section>
  );
}

// ==========================================
// ARCHIVED
// ==========================================

function ArchivedAssignments({
  assignments,
  canManage,
  onRestore,
}) {
  return (
    <section className="archived-section">
      <div className="archived-header">
        <div>
          <span className="eyebrow">
            PAST ASSIGNMENTS
          </span>

          <h3>
            Archived assignments
          </h3>

          <p>
            Past or archived
            assignments kept
            for reference.
          </p>
        </div>

        <span className="archive-count">
          {
            assignments.length
          }
        </span>
      </div>

      {!assignments.length ? (
        <div className="archived-empty">
          <Archive
            size={22}
          />

          <span>
            No archived
            assignments.
          </span>
        </div>
      ) : (
        <div className="archived-list">
          {assignments.map(
            (assignment) => (
              <article
                className="archived-card"
                key={
                  assignment.id
                }
              >
                <div>
                  <h4>
                    {
                      assignment.name
                    }
                  </h4>

                  <span>
                    Due{" "}
                    {formatDate(
                      assignment.due_date
                    )}
                  </span>

                  {assignment.description && (
                    <p>
                      {
                        assignment.description
                      }
                    </p>
                  )}
                </div>

                {canManage && (
                  <button
                    className="restore-button"
                    onClick={() =>
                      onRestore(
                        assignment.id
                      )
                    }
                  >
                    <RotateCcw
                      size={14}
                    />

                    Restore
                  </button>
                )}
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}

// ==========================================
// CALENDAR
// ==========================================

function CalendarView({
  month,
  setMonth,
  assignments,
  onSelectDate,
}) {
  const year =
    month.getFullYear();

  const monthIndex =
    month.getMonth();

  const firstDay = new Date(
    year,
    monthIndex,
    1
  ).getDay();

  const daysInMonth =
    new Date(
      year,
      monthIndex + 1,
      0
    ).getDate();

  const mondayOffset =
    (firstDay + 6) % 7;

  const cells = [];

  for (
    let i = 0;
    i < mondayOffset;
    i++
  ) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    cells.push(day);
  }

  const monthTitle =
    month.toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );

  const getAssignmentsForDay =
    (day) => {
      if (!day) {
        return [];
      }

      const date = `${year}-${pad(
        monthIndex + 1
      )}-${pad(day)}`;

      return assignments.filter(
        (item) =>
          item.due_date ===
          date
      );
    };

  return (
    <section className="calendar-section">
      <div className="calendar-header">
        <button
          className="icon-button"
          onClick={() =>
            setMonth(
              new Date(
                year,
                monthIndex - 1,
                1
              )
            )
          }
          aria-label="Previous month"
        >
          <ChevronLeft />
        </button>

        <h3>
          {monthTitle}
        </h3>

        <button
          className="icon-button"
          onClick={() =>
            setMonth(
              new Date(
                year,
                monthIndex + 1,
                1
              )
            )
          }
          aria-label="Next month"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="weekday-row">
        {[
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
          "Sun",
        ].map((day) => (
          <span key={day}>
            {day}
          </span>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map(
          (day, index) => {
            const dayAssignments =
              getAssignmentsForDay(
                day
              );

            return (
              <button
                key={index}
                className={`calendar-day ${
                  dayAssignments.length
                    ? "has-assignment"
                    : ""
                }`}
                disabled={!day}
                onClick={() => {
                  if (day) {
                    onSelectDate(
                      `${year}-${pad(
                        monthIndex + 1
                      )}-${pad(day)}`
                    );
                  }
                }}
              >
                {day && (
                  <>
                    <span className="day-number">
                      {day}
                    </span>

                    <div className="calendar-items">
                      {dayAssignments
                        .slice(
                          0,
                          2
                        )
                        .map(
                          (
                            assignment
                          ) => (
                            <span
                              key={
                                assignment.id
                              }
                            >
                              {
                                assignment.name
                              }
                            </span>
                          )
                        )}

                      {dayAssignments.length >
                        2 && (
                        <small>
                          +
                          {dayAssignments.length -
                            2}{" "}
                          more
                        </small>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          }
        )}
      </div>
    </section>
  );
}

// ==========================================
// DAY MODAL
// ==========================================

function DayModal({
  date,
  assignments,
  onClose,
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              ASSIGNMENTS
            </span>

            <h3>
              {formatDate(date)}
            </h3>
          </div>

          <button
            className="close-button"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        {assignments.length ? (
          <div className="modal-assignment-list">
            {assignments.map(
              (assignment) => (
                <div
                  className="modal-assignment"
                  key={
                    assignment.id
                  }
                >
                  <div>
                    <h4>
                      {
                        assignment.name
                      }
                    </h4>

                    {assignment.description && (
                      <p>
                        {
                          assignment.description
                        }
                      </p>
                    )}
                  </div>

                  <span
                    className={`status ${
                      assignment.graded
                        ? "graded"
                        : "not-graded"
                    }`}
                  >
                    {assignment.graded
                      ? "Graded"
                      : "Not graded"}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="modal-empty">
            No assignments on
            this date.
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// ADMIN MODAL
// ==========================================

function AdminModal({
  classInfo,
  session,
  authLoading,
  onLogin,
  onLogout,
  onClose,
}) {
  const defaultEmail = `admin-${classInfo.year}-${classInfo.department.toLowerCase()}@assignmenttracker.local`;

  const [email, setEmail] =
    useState(defaultEmail);

  const [password, setPassword] =
    useState("");

  const [loginError, setLoginError] =
    useState("");

  const handleLogin = async (
    event
  ) => {
    event.preventDefault();

    setLoginError("");

    const result =
      await onLogin(
        email,
        password
      );

    if (!result.success) {
      setLoginError(
        result.error
      );
    }
  };

  if (session) {
    return (
      <div
        className="modal-backdrop"
        onMouseDown={onClose}
      >
        <div
          className="modal admin-modal"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <div className="modal-header">
            <div>
              <span className="eyebrow">
                ADMIN
              </span>

              <h3>
                You're signed in
              </h3>
            </div>

            <button
              className="close-button"
              onClick={onClose}
            >
              <X />
            </button>
          </div>

          <p className="admin-modal-text">
            Admin controls are
            now available
            directly on the
            dashboard.
          </p>

          <button
            className="secondary-button"
            onClick={onLogout}
          >
            <LogOut
              size={16}
            />

            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="modal admin-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              RESTRICTED AREA
            </span>

            <h3>
              Admin Login
            </h3>
          </div>

          <button
            className="close-button"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        <form
          className="login-form"
          onSubmit={
            handleLogin
          }
        >
          <label htmlFor="admin-email">
            Admin account

            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target
                    .value
                )
              }
              required
            />
          </label>

          <label htmlFor="admin-password">
            Password

            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target
                    .value
                )
              }
              placeholder="Enter password"
              required
              autoFocus
            />
          </label>

          {loginError && (
            <p className="form-error">
              {loginError}
            </p>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={
              authLoading
            }
          >
            {authLoading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// ASSIGNMENT MODAL
// ==========================================

function AssignmentModal({
  classInfo,
  assignment,
  onClose,
  onSave,
}) {
  const isEditing =
    Boolean(assignment);

  const [name, setName] =
    useState(
      assignment?.name || ""
    );

  const [dueDate, setDueDate] =
    useState(
      assignment?.due_date || ""
    );

  const [graded, setGraded] =
    useState(
      assignment?.graded
        ? "true"
        : "false"
    );

  const [
    description,
    setDescription,
  ] = useState(
    assignment?.description ||
      ""
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !name.trim() ||
        !dueDate
      ) {
        setError(
          "Assignment name and due date are required."
        );

        return;
      }

      setSaving(true);
      setError("");

      try {
        await onSave({
          id: assignment?.id,

          name: name.trim(),

          dueDate,

          graded:
            graded === "true",

          description:
            description.trim(),
        });

        onClose();
      } catch (err) {
        setError(
          err.message ||
            "Unable to save assignment."
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {getYearLabel(
                classInfo.year
              )}{" "}
              YEAR ·{" "}
              {
                classInfo.department
              }
            </span>

            <h3>
              {isEditing
                ? "Edit assignment"
                : "Add assignment"}
            </h3>
          </div>

          <button
            className="close-button"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        <form
          className="assignment-form"
          onSubmit={
            handleSubmit
          }
        >
          <label>
            Assignment name

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target
                    .value
                )
              }
              placeholder="e.g. Data Structures Assignment"
              required
            />
          </label>

          <label>
            Due date

            <input
              type="date"
              value={dueDate}
              min={
                isEditing
                  ? undefined
                  : getToday()
              }
              onChange={(event) =>
                setDueDate(
                  event.target
                    .value
                )
              }
              required
            />
          </label>

          <label>
            Graded

            <select
              value={graded}
              onChange={(event) =>
                setGraded(
                  event.target
                    .value
                )
              }
            >
              <option value="false">
                Not graded
              </option>

              <option value="true">
                Graded
              </option>
            </select>
          </label>

          <label>
            Description

            <textarea
              value={
                description
              }
              onChange={(event) =>
                setDescription(
                  event.target
                    .value
                )
              }
              placeholder="Optional description..."
              rows="5"
            />
          </label>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={
                saving
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                saving
              }
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Add assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
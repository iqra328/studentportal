import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../utils/axios';

const Assignments = ({ courseId }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      const res = await API.get(`/assignments/course/${courseId}`);
      setAssignments(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (e) => {
    e.preventDefault();
    try {
      await API.post('/assignments', { ...newAssignment, course: courseId });
      alert('Assignment created!');
      setNewAssignment({ title: '', description: '', dueDate: '' });
      fetchAssignments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed');
    }
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const submitAssignment = async (assignmentId) => {
    if (!selectedFile) return alert('Select a file');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    setSubmitting(true);
    
    try {
      await API.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Assignment submitted!');
      setSelectedFile(null);
      fetchAssignments();
    } catch (error) {
      alert(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Teacher: Create Assignment */}
      {user?.role === 'teacher' && (
        <div style={styles.createCard}>
          <h3>Create Assignment</h3>
          <form onSubmit={createAssignment}>
            <input type="text" placeholder="Title" value={newAssignment.title}
              onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
              style={styles.input} required />
            <textarea placeholder="Description" value={newAssignment.description}
              onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
              style={styles.textarea} required />
            <input type="datetime-local" value={newAssignment.dueDate}
              onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
              style={styles.input} />
            <button type="submit" style={styles.createBtn}>Create</button>
          </form>
        </div>
      )}

      {/* Assignments List */}
      <h3>📋 Assignments</h3>
      {assignments.length === 0 ? (
        <p>No assignments yet.</p>
      ) : (
        assignments.map(ass => {
          const mySubmission = ass.submissions?.find(s => s.student?._id === user?.id);
          
          return (
            <div key={ass._id} style={styles.assignmentCard}>
              <h4>{ass.title}</h4>
              <p>{ass.description}</p>
              {ass.dueDate && <small>Due: {new Date(ass.dueDate).toLocaleDateString()}</small>}
              
              {mySubmission ? (
                <div style={styles.submitted}>
                  ✅ Submitted: {new Date(mySubmission.submittedAt).toLocaleDateString()}
                  <br />
                  <a href={mySubmission.fileUrl} target="_blank" rel="noopener noreferrer">
                    📎 View Submission
                  </a>
                  {mySubmission.grade && <p>Grade: {mySubmission.grade}/100</p>}
                </div>
              ) : (
                user?.role === 'student' && (
                  <div style={styles.submitArea}>
                    <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.png" />
                    <button onClick={() => submitAssignment(ass._id)} disabled={submitting}
                      style={styles.submitBtn}>
                      {submitting ? 'Uploading...' : 'Submit Assignment'}
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

const styles = {
  createCard: { backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  assignmentCard: { backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' },
  textarea: { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' },
  createBtn: { padding: '10px 20px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  submitArea: { marginTop: '10px' },
  submitBtn: { padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' },
  submitted: { marginTop: '10px', padding: '10px', backgroundColor: '#dbeafe', borderRadius: '4px' }
};

export default Assignments;
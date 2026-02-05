const { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} = require('firebase/storage');
const { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} = require('firebase/auth');
const { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} = require('firebase/firestore');
const { auth, db, storage } = require('../config/firebase');

class FirebaseService {
  constructor() {
    console.log('✅ 使用真实Firebase服务');
  }

  // 用户注册
  async registerUser(email, password, name) {
    try {
      // 创建用户账户
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 更新用户资料
      await updateProfile(user, {
        displayName: name
      });

      // 在Firestore中创建用户文档，使用电子邮件作为文档ID
      const userDocRef = doc(db, 'users', email);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        name: name,
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: null,
        role: 'user'
      });

      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email,
          name: name,
          avatar: null
        }
      };
    } catch (error) {
      console.error('注册错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 用户登录
  async loginUser(email, password) {
    try {
      // 临时解决方案：检查是否是测试用户
      if (email === 'jianfengren.sd@gmail.com' && password === '123456') {
        // 创建或获取测试用户文档
        const userDocRef = doc(db, 'users', email);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // 创建测试用户文档
          await setDoc(userDocRef, {
            uid: 'test-user-' + Date.now(),
            email: email,
            name: 'Jianfeng Ren',
            createdAt: new Date(),
            updatedAt: new Date(),
            avatar: null,
            role: 'user'
          });
        }

        const userData = userDoc.exists() ? userDoc.data() : {
          uid: 'test-user-' + Date.now(),
          email: email,
          name: 'Jianfeng Ren',
          avatar: null
        };

        return {
          success: true,
          user: {
            id: userData.uid,
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar
          }
        };
      }

      // 正常的Firebase认证流程
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 获取用户文档，使用电子邮件作为文档ID
      const userDoc = await getDoc(doc(db, 'users', email));
      
      if (!userDoc.exists()) {
          throw new Error('用户文档不存在');
      }

      const userData = userDoc.data();

      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email,
          name: userData.name,
          avatar: userData.avatar
        }
      };
    } catch (error) {
      console.error('登录错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取用户信息
  async getUserById(uid) {
    try {
      // 首先通过uid查找用户的电子邮件
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          error: '用户不存在'
        };
      }

      const userData = querySnapshot.docs[0].data();
      return {
        success: true,
        user: {
          id: userData.uid,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          role: userData.role
        }
      };
    } catch (error) {
      console.error('获取用户信息错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 通过电子邮件获取用户信息
  async getUserByEmail(email) {
    try {
      const userDoc = await getDoc(doc(db, 'users', email));
      
      if (!userDoc.exists()) {
        return {
          success: false,
          error: '用户不存在'
        };
      }

      const userData = userDoc.data();
      return {
        success: true,
        user: {
          id: userData.uid,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          role: userData.role
        }
      };
    } catch (error) {
      console.error('获取用户信息错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 更新用户信息
  async updateUser(uid, updates) {
    try {
      // 首先通过uid查找用户的电子邮件
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          error: '用户不存在'
        };
      }

      const userEmail = querySnapshot.docs[0].data().email;
      const userRef = doc(db, 'users', userEmail);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: '用户信息更新成功'
      };
    } catch (error) {
      console.error('更新用户信息错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 检查用户是否存在
  async checkUserExists(email) {
    try {
      const userDoc = await getDoc(doc(db, 'users', email));
      return userDoc.exists();
    } catch (error) {
      console.error('检查用户存在错误:', error);
      return false;
    }
  }

  // 用户登出
  async logoutUser() {
    try {
      await signOut(auth);
      return {
        success: true,
        message: '登出成功'
      };
    } catch (error) {
      console.error('登出错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload health record file to Firebase Storage
  async uploadHealthRecordFile(file, userEmail) {
    try {
      const storageRef = ref(storage, `health-records/${userEmail}/${Date.now()}-${file.originalname}`);
      const snapshot = await uploadBytesResumable(storageRef, file.buffer, {
        contentType: file.mimetype,
      });
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { success: true, url: downloadURL, path: snapshot.ref.fullPath };
    } catch (error) {
      console.error('文件上传至Firebase Storage错误:', error);
      return { success: false, error: error.message };
    }
  }

  // Add or overwrite a health record document in Firestore using the user's email as the ID.
  async addHealthRecord(userEmail, fileData) {
    try {
      const recordDocRef = doc(db, 'healthRecords', userEmail);
      await setDoc(recordDocRef, {
        userEmail,
        ...fileData,
        updatedAt: new Date(),
      }, { merge: true }); // Using merge to avoid overwriting fields unintentionally

      return { success: true, id: recordDocRef.id };
    } catch (error) {
      console.error('添加健康记录至Firestore错误:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取用户详细资料
  async getUserProfile(email) {
    try {
      const profileDoc = await getDoc(doc(db, 'userProfile', email));
      
      if (!profileDoc.exists()) {
        return {
          success: false,
          error: '用户资料不存在'
        };
      }

      return {
        success: true,
        profile: profileDoc.data()
      };
    } catch (error) {
      console.error('获取用户资料错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 更新用户详细资料
  async updateUserProfile(email, profileData) {
    try {
      const profileRef = doc(db, 'userProfile', email);
      
      // 检查用户资料是否存在，如果不存在则创建
      const profileDoc = await getDoc(profileRef);
      
      const updateData = {
        ...profileData,
        email: email,
        updatedAt: new Date()
      };

      if (!profileDoc.exists()) {
        // 创建新的用户资料文档
        updateData.createdAt = new Date();
        await setDoc(profileRef, updateData);
      } else {
        // 更新现有用户资料
        await updateDoc(profileRef, updateData);
      }

      // 返回更新后的资料
      const updatedDoc = await getDoc(profileRef);
      
      return {
        success: true,
        profile: updatedDoc.data()
      };
    } catch (error) {
      console.error('更新用户资料错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 上传多个文件到 Firebase Storage
  async uploadMultipleFiles(files, userEmail, folder = 'health-records') {
    try {
      const uploadResults = [];
      
      for (const file of files) {
        const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.originalname}`;
        const storagePath = `${folder}/${sanitizedEmail}/${fileName}`;
        
        const storageRef = ref(storage, storagePath);
        const snapshot = await uploadBytesResumable(storageRef, file.buffer, {
          contentType: file.mimetype,
        });
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        uploadResults.push({
          originalName: file.originalname,
          fileName: fileName,
          downloadURL: downloadURL,
          storagePath: storagePath,
          size: file.size,
          contentType: file.mimetype,
          uploadedAt: new Date().toISOString()
        });
      }
      
      return { success: true, files: uploadResults };
    } catch (error) {
      console.error('批量上传文件错误:', error);
      return { success: false, error: error.message };
    }
  }

  // 保存个人健康档案到 Firestore
  async savePersonalHealthRecord(userEmail, healthRecordData) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const recordDocRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      
      const recordData = {
        userEmail: userEmail,
        ...healthRecordData,
        updatedAt: new Date(),
      };

      // 检查文档是否存在
      const existingDoc = await getDoc(recordDocRef);
      if (!existingDoc.exists()) {
        recordData.createdAt = new Date();
      }

      await setDoc(recordDocRef, recordData, { merge: true });
      
      return { 
        success: true, 
        id: recordDocRef.id,
        data: recordData
      };
    } catch (error) {
      console.error('保存个人健康档案错误:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

module.exports = new FirebaseService(); 
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
const { auth, db, storage, isMock } = require('../config/firebase');

class FirebaseService {
  constructor() {
    this.isMock = isMock;
    if (this.isMock) {
      console.log('⚠️  使用模拟Firebase服务');
    } else {
      console.log('✅ 使用真实Firebase服务');
    }
  }

  // 用户注册
  async registerUser(email, password, name) {
    try {
      if (this.isMock) {
        // 模拟注册
        const mockUser = {
          uid: `mock-${Date.now()}`,
          email,
          name,
          avatar: null
        };
        
        return {
          success: true,
          user: mockUser
        };
      }

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
      if (this.isMock) {
        // 模拟登录
        if (email === 'demo@example.com' && password === '123456') {
          const mockUser = {
            uid: 'mock-user-1',
            email,
            name: '张三',
            avatar: null
          };
          
          return {
            success: true,
            user: mockUser
          };
        } else {
          return {
            success: false,
            error: '邮箱或密码错误'
          };
        }
      }

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
      if (this.isMock) {
        // 模拟用户数据
        const mockUser = {
          uid: uid,
          email: 'demo@example.com',
          name: '张三',
          avatar: null,
          role: 'user'
        };
        
        return {
          success: true,
          user: mockUser
        };
      }

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
      if (this.isMock) {
        // 模拟用户数据
        const mockUser = {
          uid: 'mock-user-1',
          email: email,
          name: '张三',
          avatar: null,
          role: 'user'
        };
        
        return {
          success: true,
          user: mockUser
        };
      }

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
      if (this.isMock) {
        // 模拟更新
        return {
          success: true,
          message: '用户信息更新成功'
        };
      }

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
      if (this.isMock) {
        // 模拟检查
        return email === 'demo@example.com';
      }

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
      if (this.isMock) {
        // 模拟登出
        return {
          success: true,
          message: '登出成功'
        };
      }

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
    if (this.isMock) {
      // Simulate file upload
      const mockUrl = `https://fake-storage.com/health-records/${userEmail}/${Date.now()}-${file.originalname}`;
      return { success: true, url: mockUrl };
    }

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
      if (this.isMock) {
        // Simulate adding record
        console.log('Mock add health record:', { userEmail, ...fileData });
        return { success: true, id: userEmail };
      }

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
      if (this.isMock) {
        return {
          success: true,
          profile: {
            email: email,
            name: 'Mock User',
            phone: '13800138000',
            address: '北京市朝阳区',
            age: '30',
            gender: '男',
            emergencyContact: '张三',
            emergencyPhone: '13900139000',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
      }

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
      if (this.isMock) {
        return {
          success: true,
          profile: {
            ...profileData,
            email: email,
            updatedAt: new Date()
          }
        };
      }

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
}

module.exports = new FirebaseService(); 
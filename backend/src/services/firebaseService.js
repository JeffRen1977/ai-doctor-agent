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
  query, 
  where, 
  getDocs 
} = require('firebase/firestore');
const { auth, db } = require('../config/firebase');

class FirebaseService {
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

      // 在Firestore中创建用户文档
      await setDoc(doc(db, 'users', user.uid), {
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 获取用户文档
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
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
      const userDoc = await getDoc(doc(db, 'users', uid));
      
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
      const userRef = doc(db, 'users', uid);
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
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
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
}

module.exports = new FirebaseService(); 
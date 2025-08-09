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
const { auth, db, isMock } = require('../config/firebase');

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
      if (this.isMock) {
        // 模拟更新
        return {
          success: true,
          message: '用户信息更新成功'
        };
      }

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
      if (this.isMock) {
        // 模拟检查
        return email === 'demo@example.com';
      }

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
}

module.exports = new FirebaseService(); 
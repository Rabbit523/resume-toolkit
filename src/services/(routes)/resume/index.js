import BaseApiProvider from '@/services/(routes)/BaseApiProvider';
import { AxiosError } from 'axios';
import config from '@/services/(routes)/config';
import authHeader from '@/helpers/auth-header';
import { ERROR_FAILED } from '@/config/constants';

const API_URL = config.baseApiUrl + `resume/`;

class ResumeService extends BaseApiProvider {
  // Return full response instead of just data
  _afterResponse(response) {
    return response;
  }

  _responseError(error) {
    if (error instanceof AxiosError) {
      return error.response;
    } else {
      throw error;
    }
  }

  async getResumes({
    currentPage,
    limit,
    sortBy,
    sortOrder,
    startDate = '',
    endDate = '',
    companyName = '',
    profileId = '',
    description = ''
  }) {
    return await this.api
      .get(
        API_URL +
          `get-resumes?page=${currentPage}&limit=${limit}&sortby=${sortBy}&order=${sortOrder}` +
          `&startDate=${startDate}&endDate=${endDate}&companyName=${companyName}&profileId=${profileId}&description=${description}`,
        { headers: authHeader() }
      )
      .then((response) => {
        const { data, status } = response;
        if ([200, 201].includes(status)) {
          return data;
        }
      })
      .catch(({ response }) => {
        if (!response) {
          return { error: ERROR_FAILED, msg: 'ERROR-OCCUR' };
        } else {
          const { data, status } = response;
          if ([401].includes(status)) {
            return { error: ERROR_FAILED, msg: data.msg || '' };
          }
        }
      });
  }

  async getResumesReport(range) {
    return await this.api
      .get(API_URL + `get-resumes-report?range=${range}`, { headers: authHeader() })
      .then((response) => {
        const { data, status } = response;
        if ([200, 201].includes(status)) {
          return data;
        }
      })
      .catch(({ response }) => {
        if (!response) {
          return { error: ERROR_FAILED, msg: 'ERROR-OCCUR' };
        } else {
          const { data, status } = response;
          if ([401].includes(status)) {
            return { error: ERROR_FAILED, msg: data.msg || '' };
          }
        }
      });
  }

  // ✅ Update resume (PUT /resume/:id)
  async updateResume(id, params) {
    return await this.api
      .put(API_URL + `${id}`, params, { headers: authHeader() })
      .then(({ data, status }) => ([200, 201].includes(status) ? data : null))
      .catch(({ response }) => this._handleError(response));
  }

  // ✅ Delete resume (DELETE /resume/:id)
  async deleteResume(id) {
    return await this.api
      .delete(API_URL + `${id}`, { headers: authHeader() })
      .then(({ data, status }) => ([200, 201].includes(status) ? data : null))
      .catch(({ response }) => this._handleError(response));
  }
}

const resumeService = new ResumeService();
export default resumeService;
